import {    
    TreeConfiguration,
    SchemaFactory
} from '@fluidframework/tree';

const sf = new SchemaFactory('fc1db2e8-0a00-11ee-be56-0242ac120002');

export class Position extends sf.object('Position', {
    x: sf.number,
    y: sf.number,
}){}

export class Letter extends sf.object('Letter', {
    position: Position,
    character: sf.string,
    id: sf.string,
}){}

export class App extends sf.object('App', {
    letters: sf.array(Letter),
    word: sf.array(Letter),
}) {}

export const treeConfiguration = new TreeConfiguration(
    App,
    () => ({
        letters: [],
        word: [],
    }),    
);
