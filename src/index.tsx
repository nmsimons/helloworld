/* eslint-disable react/jsx-key */
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { loadFluidData, containerSchema } from './infra/fluid';
import { initializeDevtools } from '@fluid-experimental/devtools';
import { devtoolsLogger } from './infra/clientProps';
import { ITree, TreeView } from '@fluid-experimental/tree2';
import { appSchemaConfig, App, letter, Letter } from './schema';
import { IFluidContainer } from 'fluid-framework';
import { Tree } from '@fluid-experimental/tree2';
import './output.css';

function CanvasLetter(props: {
    app: App;
    letter: Letter;
    cellSize: { x: number; y: number };    
}): JSX.Element {

    const style: React.CSSProperties = {
              left: `${props.letter.position.x}px`,
              top: `${props.letter.position.y}px`,
              width: `${props.cellSize.x}px`,
              height: `${props.cellSize.y}px`,
          };

    return (
        <div
            className="text-center cursor-pointer select-none absolute text-xl"
            style={style}
            onClick={() => {                
                const index = props.app.letters.indexOf(props.letter);
                if (index != -1) props.app.word.moveToEnd(index, props.app.letters);
            }}
        >
            {props.letter.character}
        </div>
    );
}

function TopLetter(props: {
    app: App;
    letter: Letter;        
}): JSX.Element {

    const [isWinner, setIsWinner] = useState(false);
    
    useEffect(() => {        
        if (props.app.word.map((letter) => {return letter.character} ).join("") == "HELLO") {
            setIsWinner(true);
        } else {
            setIsWinner(false);
        }        
    }, [props.app.word.length])    

    const classes = (`text-center cursor-pointer select-none transition-all tracking-widest text-2xl ${
        isWinner ? ' font-extrabold text-3xl' : ' animate-bounce text-2xl'
    }`);

    return (
        <div
            className={classes}            
            onClick={() => {                                
                const index = props.app.word.indexOf(props.letter);
                if (index != -1) props.app.letters.moveToEnd(index, props.app.word);
            }}
        >
            {props.letter.character}
        </div>
    );
}

function Canvas(props: {
    app: App;
    cellSize: { x: number; y: number };
    canvasSize: { x: number; y: number };
}): JSX.Element {
    const style: React.CSSProperties = {
        width: (props.cellSize.x * props.canvasSize.x).toString() + `px`,
        height: (props.cellSize.y * props.canvasSize.y).toString() + `px`,
    };

    return (
        <div
            className="relative w-full h-full self-center bg-transparent"
            style={style}
            onClick={(e: React.MouseEvent) => {
                e.preventDefault();
            }}
        >
            {props.app.letters.map((letter) => (
                <CanvasLetter
                    key={letter.id}
                    app={props.app}
                    letter={letter}
                    cellSize={props.cellSize}
                />
            ))}
        </div>
    );
}

function TopRow(props: {
    app: App;    
}): JSX.Element {
    return (
        <div className="flex justify-center bg-gray-300 p-4 gap-1 h-16">
            {props.app.word.map((letter) => (
                <TopLetter
                    key={letter.id}
                    app={props.app}
                    letter={letter}                    
                />
            ))}
        </div>
    );
}

function ReactApp(props: {
    data: TreeView<App>;
    container: IFluidContainer;
    cellSize: { x: number; y: number };
    canvasSize: { x: number; y: number };
}): JSX.Element {
    const [invalidations, setInvalidations] = useState(0);

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

    return (
        <div className="flex flex-col justify-items-center w-full h-full">
            <TopRow app={appRoot} />
            <Canvas
                app={appRoot}
                canvasSize={props.canvasSize}
                cellSize={props.cellSize}
            />
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
    const appData = (container.initialObjects.appData as ITree).schematize(
        appSchemaConfig
    );

    const cellSize = { x: 32, y: 32 };
    const canvasSize = { x: 20, y: 20 }; // characters across and down
    
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
    root.render(
        <ReactApp
            data={appData}
            container={container}
            canvasSize={canvasSize}
            cellSize={cellSize}
        />
    );

    // If this is a new container, fill it with data
    if (containerId.length == 0) {
        const used: { x: number; y: number }[] = [];
        let id = 0;
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
            .repeat(500)
            .split('')
            .map((character) => {
                const x = Math.round(
                    Math.floor(
                        (Math.random() * (canvasSize.x * cellSize.x)) / cellSize.x
                    ) * cellSize.x
                );
                const y = Math.round(
                    Math.floor(
                        (Math.random() * (canvasSize.y * cellSize.y)) / cellSize.y
                    ) * cellSize.y
                );
                if (!used.find((element) => element.x == x && element.y == y)) {
                    const pos = { x, y };
                    used.push(pos);
                    appData.root.letters.insertAtEnd(
                        // TODO: error when not adding wrapping [] is inscrutable
                        [
                            letter.create({
                                position: pos,
                                character,
                                id: id.toString(),
                            }),
                        ]
                    );
                    id++;
                }
            });
    }

    // If the app is in a `createNew` state - no containerId, and the container is detached, we attach the container.
    // This uploads the container to the service and connects to the collaboration session.
    if (containerId.length == 0) {
        containerId = await container.attach();

        // The newly attached container is given a unique ID that can be used to access the container in another session
        location.hash = containerId;
    }
}

export default main();
