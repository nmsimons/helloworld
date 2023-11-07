/* eslint-disable react/jsx-key */
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    initializeSharedTree,
    loadFluidData,
    lettersContainerSchema,
} from './infra/fluid';
import { initializeDevtools } from '@fluid-experimental/devtools';
import { devtoolsLogger } from './infra/clientProps';
import { ISharedTree } from '@fluid-experimental/tree2';
import { appSchemaConfig, App } from './app_schema';
import { SharedTree } from './infra/fluid';
import { ConnectionState, IFluidContainer } from 'fluid-framework';
import { node as Tree } from '@fluid-experimental/tree2';
import './output.css';

type LetterProps = {
    letter: string;
    onClick: (letter: string) => void;
    isOnCanvas: boolean;
};

type CanvasProps = {
    letters: string[];
    onLetterClick: (letter: string) => void;
};

type TopRowProps = {
    selectedLetters: string[];
    onLetterClick: (letter: string) => void;
};

// Helper function to generate random positions
const getRandomPosition = (
    elementWidth: number,
    elementHeight: number,
    canvasWidth: number,
    canvasHeight: number
) => {
    const x = Math.floor(Math.random() * (canvasWidth - elementWidth));
    const y = Math.floor(Math.random() * (canvasHeight - elementHeight));
    return { x, y };
};

// The Letter component represents a single letter
const Letter: React.FC<LetterProps> = ({ letter, onClick, isOnCanvas }) => {
    // Only calculate random position if the letter is on the canvas
    const position = isOnCanvas
        ? getRandomPosition(50, 50, 300, 300) // Assuming each letter is 50x50 and canvas is 300x300
        : { x: 0, y: 0 };

    // Using React.CSSProperties to ensure type safety
    const style: React.CSSProperties = isOnCanvas
        ? {
              position: 'absolute',
              left: position.x, // TypeScript will interpret this as `px`
              top: position.y, // TypeScript will interpret this as `px`
          }
        : {};

    return (
        <div
            className={`letter ${isOnCanvas ? 'cursor-pointer' : 'm-1'}`}
            style={style}
            onClick={() => onClick(letter)}
        >
            {letter}
        </div>
    );
};

// The Canvas component represents the area where letters are spread randomly
const Canvas: React.FC<CanvasProps> = ({ letters, onLetterClick }) => {
    return (
        <div className="canvas relative w-300 h-300 bg-gray-200">
            {letters.map((letter) => (
                <Letter
                    key={letter}
                    letter={letter}
                    onClick={onLetterClick}
                    isOnCanvas={true}
                />
            ))}
        </div>
    );
};

// The TopRow component represents the area where clicked letters are collected
const TopRow: React.FC<TopRowProps> = ({ selectedLetters, onLetterClick }) => {
    return (
        <div className="top-row flex justify-center bg-gray-300 p-4">
            {selectedLetters.map((letter) => (
                <Letter
                    key={letter}
                    letter={letter}
                    onClick={onLetterClick}
                    isOnCanvas={false}
                />
            ))}
        </div>
    );
};

function Header(props: {
    saved: boolean;
    connectionState: string;
    clientId: string;
}): JSX.Element {
    return (
        <>
            <div className="h-10 w-full"></div>
            <div className="fixed flex flex-row justify-between bg-black h-10 text-base text-white z-40 w-full">
                <div className="m-2">shared-tree-demo</div>
                <div className="m-2">
                    {props.saved ? 'saved' : 'not saved'} | {props.connectionState}
                </div>
            </div>
        </>
    );
}

function ReactApp(props: {
    data: SharedTree<App>;
    container: IFluidContainer;
}): JSX.Element {
    const [invalidations, setInvalidations] = useState(0);
    const [connectionState, setConnectionState] = useState('');
    const [saved, setSaved] = useState(!props.container.isDirty);

    const appRoot = props.data.root;

    // Register for tree deltas when the component mounts.
    // Any time the tree changes, the app will update
    // For more complex apps, this code can be included
    // on lower level components.
    useEffect(() => {
        // Returns the cleanup function to be invoked when the component unmounts.
        return Tree.on(appRoot, 'afterChange', () => {
            setInvalidations(invalidations + Math.random());
        });
    }, [invalidations]);

    useEffect(() => {
        const updateConnectionState = () => {
            if (props.container.connectionState === ConnectionState.Connected) {
                setConnectionState('connected');
            } else if (
                props.container.connectionState === ConnectionState.Disconnected
            ) {
                setConnectionState('disconnected');
            } else if (
                props.container.connectionState ===
                ConnectionState.EstablishingConnection
            ) {
                setConnectionState('connecting');
            } else if (
                props.container.connectionState === ConnectionState.CatchingUp
            ) {
                setConnectionState('catching up');
            }
        };
        updateConnectionState();
        props.container.on('connected', updateConnectionState);
        props.container.on('disconnected', updateConnectionState);
        props.container.on('dirty', () => setSaved(false));
        props.container.on('saved', () => setSaved(true));
        props.container.on('disposed', updateConnectionState);
    }, []);

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const [canvasLetters, setCanvasLetters] = useState<string[]>(alphabet);
    const [selectedLetters, setSelectedLetters] = useState<string[]>([]);

    // Function to handle letter clicks to move from canvas to top row or vice versa
    const handleLetterClick = (clickedLetter: string) => {
        if (canvasLetters.includes(clickedLetter)) {
            setCanvasLetters(
                canvasLetters.filter((letter) => letter !== clickedLetter)
            );
            setSelectedLetters([...selectedLetters, clickedLetter]);
        } else {
            setSelectedLetters(
                selectedLetters.filter((letter) => letter !== clickedLetter)
            );
            setCanvasLetters([...canvasLetters, clickedLetter]);
        }
    };

    return (
        <div className="app flex flex-col items-center pt-10">
            <Header
                saved={saved}
                connectionState={connectionState}
                clientId={'testUser'}
            />
            <TopRow
                selectedLetters={selectedLetters}
                onLetterClick={handleLetterClick}
            />
            <Canvas letters={canvasLetters} onLetterClick={handleLetterClick} />
        </div>
    );
}

async function main() {
    // create the root element for React
    const app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);
    const root = createRoot(app);

    // Get the root container id from the URL
    // If there is no container id, then the app will make
    // a new container.
    let containerId = location.hash.substring(1);

    // Initialize Fluid Container
    const { container } = await loadFluidData(containerId, lettersContainerSchema);

    if (containerId.length == 0) {
        // Initialize our Fluid data -- set default values, establish relationships, etc.
        (container.initialObjects.appData as ISharedTree).schematize(
            appSchemaConfig
        );
    }

    const appData = initializeSharedTree<App>(
        container.initialObjects.appData,
        appSchemaConfig
    );

    // Initialize debugging tools
    initializeDevtools({
        logger: devtoolsLogger,
        initialContainers: [
            {
                container,
                containerKey: 'My Container',
            },
        ],
    });

    // Render the app - note we attach new containers after render so
    // the app renders instantly on create new flow. The app will be
    // interactive immediately.
    root.render(<ReactApp data={appData} container={container} />);

    // If the app is in a `createNew` state - no containerId, and the container is detached, we attach the container.
    // This uploads the container to the service and connects to the collaboration session.
    if (containerId.length == 0) {
        containerId = await container.attach();

        // The newly attached container is given a unique ID that can be used to access the container in another session
        location.hash = containerId;
    }
}

export default main();
