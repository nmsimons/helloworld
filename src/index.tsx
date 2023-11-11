/* eslint-disable react/jsx-key */
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    loadFluidData,
    containerSchema,
} from './infra/fluid';
import { initializeDevtools } from '@fluid-experimental/devtools';
import { devtoolsLogger } from './infra/clientProps';
import { ITree, TreeView } from '@fluid-experimental/tree2';
import { appSchemaConfig, App, letter, Letter } from './schema';
import { ConnectionState, IFluidContainer } from 'fluid-framework';
import { Tree } from '@fluid-experimental/tree2';
import './output.css';

function BoxedLetter(props: {
    app: App;
    letter: Letter;
    isOnCanvas: boolean;
}): JSX.Element {
    const position = props.isOnCanvas
        ? { x: props.letter.x, y: props.letter.y }
        : { x: 0, y: 0 };

    const letterClasses = `letter ${
        props.isOnCanvas ? 'cursor-pointer text-base' : 'm-1 text-xl'
    }`;

    const style: React.CSSProperties = props.isOnCanvas
        ? {
              position: 'absolute',
              left: `${position.x}px`,
              top: `${position.y}px`,
          }
        : {};

    return (
        <div
            className={letterClasses}
            style={style}
            onClick={() => {
                const letterSource =
                    Tree.parent(props.letter) === props.app.word
                        ? props.app.word
                        : props.app.letters;
                const letterDst =
                    letterSource === props.app.letters
                        ? props.app.word
                        : props.app.letters;
                const index = letterSource.indexOf(props.letter);
                letterDst.moveToEnd(index, letterSource);
            }}
        >
            {props.letter.character}
        </div>
    );
}

function Canvas(props: { app: App }): JSX.Element {
    return (
        <div className="canvas relative w-300 h-300 bg-white-200">
            {props.app.letters.map((letter) => (
                <BoxedLetter
                    key={letter.id}
                    app={props.app}
                    letter={letter}
                    isOnCanvas={true}
                />
            ))}
        </div>
    );
}

function TopRow(props: { app: App }): JSX.Element {
    return (
        <div className="top-row flex justify-center bg-gray-300 p-4 gap-1">
            {props.app.word.map((letter) => (
                <BoxedLetter
                    key={letter.character}
                    app={props.app}
                    letter={letter}
                    isOnCanvas={false}
                />
            ))}
        </div>
    );
}

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
    data: TreeView<App>;
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

    const canvasStyle: React.CSSProperties = {
        position: 'fixed',
        top: 100,
        left: 0,
        width: '100%',
        height: '100%',
    };

    return (
        <div className="app flex flex-col items-center w-full h-full">
            <Header
                saved={saved}
                connectionState={connectionState}
                clientId={'testUser'}
            />
            <div className="top-row z-10">
                <TopRow app={appRoot} />
            </div>
            <div className="canvas z-0" style={canvasStyle}>
                <Canvas app={appRoot} />
            </div>
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
    const { container } = await loadFluidData(containerId, containerSchema);
    
    // Initialize the SharedTree Data Structure
    const appData = (container.initialObjects.appData as ITree).schematize(appSchemaConfig);

    // If this is a new container, fill it with data
    if (containerId.length == 0) {
        let id = 0;
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
            .repeat(5)
            .split('')
            .map((character) => {
                const x = Math.floor(Math.random() * window.innerWidth);
                const y = Math.floor(Math.random() * window.innerHeight);
                appData.root.letters.insertAtEnd(
                    // TODO: error when not adding wrapping [] is inscrutable
                    [
                        letter.create({
                            x,
                            y,
                            character,
                            id: id.toString(),
                        }),
                    ]
                );
                id++;
            });
    }

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
