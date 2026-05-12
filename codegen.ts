import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'src/graphql/schema.graphql',

  documents: 'src/**/*.graphql',

  generates: {
    './src/graphql/generated.ts': {
      plugins: [
        {
          add: {
            content:
              "const TypedDocumentString = String as unknown as { new <TData = unknown, TVariables = unknown>(source: string): string & { __apiType?: TData; __variablesType?: TVariables } }",
          },
        },
        'typescript-operations',
        'typescript-react-query',
      ],

      config: {
        enumsAsTypes: true,
        enumPrefix: false,
        onlyOperationTypes: true,
        preResolveTypes: true,
        fetcher: {
          endpoint: "'/graphql'",
          fetchParams: {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        },
        reactQueryVersion: 5,
        exposeQueryKeys: true,
        exposeFetcher: true,
        useTypeImports: true,
      },
    },
  },
}

export default config
