import {
  ASTPath,
  Collection,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportSpecifier,
  Transform,
} from "jscodeshift";

const transformer: Transform = (file, api) => {
  const j = api.jscodeshift;

  const source = j(file.source);

  renameOrCreateApolloClientImport();

  moveSpecifiersToApolloClient("react-apollo");
  moveSpecifiersToApolloClient("react-apollo/types");
  moveSpecifiersToApolloClient("@apollo/react-hooks");
  moveSpecifiersToApolloClient("apollo-cache-inmemory");
  moveSpecifiersToApolloClient("apollo-link");
  moveSpecifiersToApolloClient("apollo-link-http");
  moveSpecifiersToApolloClient("apollo-link-http-common");

  renameDefaultSpecifier(getImport("graphql-tag"), "gql");
  moveSpecifiersToApolloClient("graphql-tag");

  renameImport("@apollo/react-components", "@apollo/client/react/components");
  renameImport("@apollo/react-hoc", "@apollo/client/react/hoc");
  renameImport("@apollo/react-ssr", "@apollo/client/react/ssr");
  renameImport("@apollo/react-testing", "@apollo/client/testing");
  renameImport("react-apollo/test-utils", "@apollo/client/testing");
  renameImport("apollo-test-utils", "@apollo/client/testing");

  renameDefaultSpecifier(getImport("apollo-link-schema"), "SchemaLink");
  [
    "batch",
    "batch-http",
    "context",
    "error",
    "persisted-queries",
    "retry",
    "schema",
    "ws",
  ].forEach((link) =>
    renameImport(`apollo-link-${link}`, `@apollo/client/link/${link}`)
  );

  moveSpecifiersFromApolloClient(
    ["graphql", "withApollo", "ChildProps", "QueryProps"],
    "@apollo/client/react/hoc"
  );
  moveSpecifiersFromApolloClient(["compose"], "lodash");
  renameSpecifier("lodash", "compose", "flowRight");
  renameSpecifier("@apollo/client/react/hoc", "QueryProps", "QueryControls");
  renameSpecifier("@apollo/client", "MutationFunc", "MutationFunction");
  renameSpecifier("@apollo/client", "QueryOpts", "BaseQueryOptions");
  renameSpecifier("@apollo/client", "MutationOpts", "BaseMutationOptions");
  renameSpecifier("@apollo/client", "ApolloExecutionResult", "FetchResult");

  removeApolloClientImportIfEmpty();

  reorderGraphqlTypes();

  return source.toSource();

  function renameOrCreateApolloClientImport() {
    const ac3Import = getImport("@apollo/client");
    if (ac3Import.size()) {
      return;
    }

    const ac2Import = getImport("apollo-client");
    if (ac2Import.size()) {
      renameDefaultSpecifier(ac2Import, "ApolloClient");
      renameImport("apollo-client", "@apollo/client");
    } else {
      createImport("@apollo/client");
    }
  }

  function removeApolloClientImportIfEmpty() {
    const ac3Import = getImport("@apollo/client");
    if (ac3Import.size() && !ac3Import.get("specifiers", "length").value) {
      ac3Import.remove();
    }
  }

  function moveSpecifiersToApolloClient(moduleName: string) {
    const moduleImport = getImport(moduleName);

    if (moduleImport.size()) {
      const clientImports = getImport("@apollo/client");
      const specifiersToAdd = moduleImport.get("specifiers").value;
      clientImports.get("specifiers").push(...specifiersToAdd);
    }

    moduleImport.remove();
  }

  function moveSpecifiersFromApolloClient(
    specifiers: string[],
    moduleName: string
  ) {
    const clientImports = getImport("@apollo/client");

    const clientSpecifiers = clientImports.find(j.ImportSpecifier, (node) => {
      return specifiers.includes(node.imported.name);
    });

    if (clientSpecifiers.size()) {
      const newImport = createImport(moduleName, clientSpecifiers.nodes());

      clientSpecifiers.remove();
    }
  }

  function createImport(
    moduleName: string,
    specifiers: Parameters<typeof j.importDeclaration>[0] = []
  ) {
    const newImport = j.importDeclaration(specifiers, j.literal(moduleName));

    source
      .find(j.ImportDeclaration)
      .at(0)
      .insertBefore(() => newImport);

    return j(newImport);
  }

  function renameImport(oldModuleName: string, newModuleName: string) {
    getImport(oldModuleName)
      .find(j.Literal)
      .replaceWith((path) => ({
        ...path.value,
        value: newModuleName,
      }));
  }

  function getImport(moduleName: string) {
    return source.find(j.ImportDeclaration, {
      source: { value: moduleName },
    });
  }

  function renameSpecifier(
    moduleName: string,
    nameBefore: string,
    nameAfter: string
  ) {
    getImport(moduleName)
      .find(j.ImportSpecifier, {
        imported: {
          name: nameBefore,
        },
      })
      .replaceWith((path) =>
        j.importSpecifier(j.identifier(nameAfter), path.value.local)
      );
  }

  function renameDefaultSpecifier(
    moduleImport: Collection<ImportDeclaration>,
    name: string
  ) {
    function replacer(path: ASTPath<ImportSpecifier | ImportDefaultSpecifier>) {
      return path.value.local?.name === name
        ? j.importSpecifier(j.identifier(name))
        : j.importSpecifier(j.identifier(name), path.value.local);
    }

    // Handle ordinary (no-{}s) default imports.
    moduleImport.find(j.ImportDefaultSpecifier).replaceWith((x) => replacer(x));

    // Handle { default as Foo } default imports.
    moduleImport
      .find(j.ImportSpecifier, {
        imported: {
          name: "default",
        },
      })
      .replaceWith(replacer);
  }

  function reorderGraphqlTypes() {
    source
      .find(j.CallExpression, {
        callee: {
          name: "graphql",
        },
      })
      .replaceWith(({ node }: any) => {
        if (!node.typeParameters?.params) {
          node.typeParameters = j.tsTypeParameterInstantiation([
            j.tsAnyKeyword(),
            j.tsAnyKeyword(),
            j.tsAnyKeyword(),
            j.tsAnyKeyword(),
          ]);

          return node;
        }

        const [resultTypeParam, propsTypeParam, childPropsTypeParam] =
          node.typeParameters.params;

        node.typeParameters.params = [
          propsTypeParam ?? j.tsAnyKeyword(),
          resultTypeParam ?? j.tsAnyKeyword(),
          j.tsAnyKeyword(),
          childPropsTypeParam ?? j.tsAnyKeyword(),
        ];

        return node;
      });
  }
};

export default transformer;
