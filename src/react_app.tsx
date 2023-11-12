import React, { useEffect, useState } from 'react';
import { TreeView } from '@fluid-experimental/tree2';
import { App, Letter } from './schema';
import { IFluidContainer } from 'fluid-framework';
import { Tree } from '@fluid-experimental/tree2';

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

function TopLetter(props: { app: App; letter: Letter }): JSX.Element {
    const [isWinner, setIsWinner] = useState(false);

    useEffect(() => {
        if (
            props.app.word
                .map((letter) => {
                    return letter.character;
                })
                .join('') == 'HELLO'
        ) {
            setIsWinner(true);
        } else {
            setIsWinner(false);
        }
    }, [props.app.word.length]);

    const classes = `text-center cursor-pointer select-none transition-all tracking-widest text-2xl ${
        isWinner ? ' font-extrabold text-3xl' : ' animate-bounce text-2xl'
    }`;

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

function TopRow(props: { app: App }): JSX.Element {
    return (
        <div className="flex justify-center bg-gray-300 p-4 gap-1 h-16">
            {props.app.word.map((letter) => (
                <TopLetter key={letter.id} app={props.app} letter={letter} />
            ))}
        </div>
    );
}

export function ReactApp(props: {
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
