import {
    AllowedUpdateType,
    ProxyNode,
    SchemaBuilder,
    buildTreeConfiguration,
} from '@fluid-experimental/tree2';

const sb = new SchemaBuilder({ scope: 'fc1db2e8-0a00-11ee-be56-0242ac120002' });

export const position = sb.object('position', {
    x: sb.number,
    y: sb.number,
})

export const letter = sb.object('letter', {
    position: position,
    character: sb.string,
    id: sb.string,
});

export const app = sb.object('app', {
    letters: sb.list(letter),
    word: sb.list(letter),
});

export type App = ProxyNode<typeof app>;
export type Letter = ProxyNode<typeof letter>;
export type Position = ProxyNode<typeof position>;

export const appSchema = sb.intoSchema(app);

export const appSchemaConfig = buildTreeConfiguration({
    schema: appSchema,
    initialTree: {
        letters: {"":[]},
        word: {"":[]},
    },
    allowedSchemaModifications: AllowedUpdateType.SchemaCompatible,
});
