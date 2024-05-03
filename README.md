# Replace Config Transform for GraphQL Mesh

Replace Config Transform - is a transform for GraphQL Mesh that allows you to replace or modify the configurations of your GraphQL schema based on specified rules. This can be useful for adding descriptions, deprecating fields, changing default values, and other aspects of the schema.

## Installation

Before you can use the replace-config-transform, you need to install it along with GraphQL Mesh if you haven't already done so. You can install these using npm or yarn.

```bash
npm install @dmamontov/graphql-mesh-replace-config-transform
```

or

```bash
yarn add @dmamontov/graphql-mesh-replace-config-transform
```

## Configuration

### Modifying tsconfig.json

To make TypeScript recognize the Replace Config Transform, you need to add an alias in your tsconfig.json.

Add the following paths configuration under the compilerOptions in your tsconfig.json file:

```json
{
  "compilerOptions": {
    "paths": {
       "replace-config": ["node_modules/@dmamontov/graphql-mesh-replace-config-transform"]
    }
  }
}
```

### Adding the Transform to GraphQL Mesh

You need to include the Replace Config Transform in your GraphQL Mesh configuration file (usually .meshrc.yaml). Below is an example configuration that demonstrates how to use this transform:

```yaml
transforms:
  - replaceConfig:
      - typeName: PersonalDataInput
        fieldName: phone
        description: 'Filter by phone'
        deprecated: true
        nullable: false
        defaultValue: 79998887766
        extensions:
          custom: true
        directives:
          - name: constraint
            args:
              pattern: "^7\\d{10}$"
```

! This transform does not add directive and extension logic.

## Capabilities

This transform allows you to change the following parameters in various parts of your GraphQL schema:

- **description**: Available for Input, Composite, Enums.
- **deprecated**: Available for Input, Composite, Enums.
- **nullable**: Available for Input, Composite.
- **defaultValue**: Available only for Input.
- **extensions**: Available for Input, Composite, Enums.
- **directives**: Available for Input, Composite, Enums.

## Conclusion

Remember, always test your configurations in a development environment before applying them in production to ensure that everything works as expected.