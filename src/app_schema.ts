import {
    AllowedUpdateType,
    InitializeAndSchematizeConfiguration,
    ProxyNode,
    SchemaBuilder,
} from '@fluid-experimental/tree2';

const sb = new SchemaBuilder({ scope: 'fc1db2e8-0a00-11ee-be56-0242ac120002' });

export const letter = sb.object('letter', {
    x: sb.number,
    y: sb.number,
    character: sb.string,
    id: sb.string,
});

export const app = sb.object('app', {
    letters: sb.list(letter),
    word: sb.list(letter),
});

export type App = ProxyNode<typeof app>;
export type Letter = ProxyNode<typeof letter>;

export const appSchema = sb.intoSchema(app);

export const appSchemaConfig: InitializeAndSchematizeConfiguration = {
    schema: appSchema,
    initialTree: {
        letters: [],
        word: [],
    },
    allowedSchemaModifications: AllowedUpdateType.SchemaCompatible,
};
