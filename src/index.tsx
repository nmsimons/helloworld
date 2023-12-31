/* eslint-disable react/jsx-key */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { loadFluidData, containerSchema } from './infra/fluid';
import { initializeDevtools } from '@fluidframework/devtools';
import { devtoolsLogger } from './infra/clientProps';
import { ITree } from '@fluidframework/tree';
import { treeConfiguration, Letter } from './schema';
import './output.css';
import { ReactApp } from './react_app';

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
        treeConfiguration
    );

    const cellSize = { x: 32, y: 32 };
    const canvasSize = { x: 10, y: 10 }; // characters across and down

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
        'HELLOWORLD'
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
                            new Letter({
                                position: pos,
                                character,
                                id: id.toString(),
                            }),
                        
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
