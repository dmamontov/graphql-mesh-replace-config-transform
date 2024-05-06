// eslint-disable-next-line import/no-nodejs-modules
import * as fs from 'node:fs';
// eslint-disable-next-line import/no-nodejs-modules
import * as path from 'node:path';
import {
    buildSchema,
    GraphQLEnumType,
    GraphQLNonNull,
    type BooleanValueNode,
    type FloatValueNode,
    type GraphQLArgument,
    type GraphQLObjectType,
    type GraphQLSchema,
    type IntValueNode,
    type StringValueNode,
} from 'graphql';
import { Kind } from 'graphql/index';
import { type SubschemaConfig } from '@graphql-tools/delegate';
import ReplaceConfigTransform from '../src';
import { type ReplaceConfigTransformConfig } from '../src/types';

describe('ReplaceConfigTransform', () => {
    let originalSchema: GraphQLSchema;

    beforeEach(() => {
        originalSchema = buildSchemaFromFile('schema.graphql');
    });

    it('Should apply description positive transformations to the schema', () => {
        const transform = new ReplaceConfigTransform({
            config: [
                {
                    typeName: 'TestResult',
                    fieldName: 'first',
                    description: false,
                },
                {
                    typeName: 'TestResult',
                    fieldName: 'second',
                    description: 'test-result-field-second-description',
                },
            ] as ReplaceConfigTransformConfig[],
        });

        const transformedSchema = transform.transformSchema(originalSchema, {} as SubschemaConfig);

        const fields = (transformedSchema.getType('TestResult') as GraphQLObjectType).getFields();

        expect(fields.first.description).toBeNull();
        expect(fields.second.description).toBe('test-result-field-second-description');
        expect(fields.second.extensions.description).toBe('test-result-field-second-description');
    });

    it('Should apply description negative transformations to the schema', () => {
        const transform = new ReplaceConfigTransform({
            config: [
                {
                    typeName: 'TestResult',
                    fieldName: 'first',
                    description: true,
                },
            ] as ReplaceConfigTransformConfig[],
        });

        const wrapped = () => {
            transform.transformSchema(originalSchema, {} as SubschemaConfig);
        };

        expect(wrapped).toThrow(TypeError);
        expect(wrapped).toThrow('Description can only be false or a string.');
    });

    it('Should apply deprecated positive transformations to the schema', () => {
        const transform = new ReplaceConfigTransform({
            config: [
                {
                    typeName: 'TestInput',
                    fieldName: 'first',
                    deprecated: false,
                },
                {
                    typeName: 'TestInput',
                    fieldName: 'second',
                    deprecated: true,
                },
                {
                    typeName: 'TestInput',
                    fieldName: 'three',
                    deprecated: 'test-input-field-three-deprecated',
                },
            ] as ReplaceConfigTransformConfig[],
        });

        const transformedSchema = transform.transformSchema(originalSchema, {} as SubschemaConfig);

        const fields = (transformedSchema.getType('TestInput') as GraphQLObjectType).getFields();

        expect(fields.first.deprecationReason).toBeNull();
        expect(fields.second.deprecationReason).toBe('Deprecated');
        expect(fields.three.deprecationReason).toBe('test-input-field-three-deprecated');
    });

    it('Should apply nullable positive transformations to the schema', () => {
        const transform = new ReplaceConfigTransform({
            config: [
                {
                    typeName: 'TestResult',
                    fieldName: 'first',
                    nullable: false,
                },
                {
                    typeName: 'TestResult',
                    fieldName: 'second',
                    nullable: true,
                },
            ] as ReplaceConfigTransformConfig[],
        });

        const transformedSchema = transform.transformSchema(originalSchema, {} as SubschemaConfig);

        const fields = (transformedSchema.getType('TestResult') as GraphQLObjectType).getFields();

        expect(fields.first.type).toBeInstanceOf(GraphQLNonNull);
        expect(fields.first.extensions.nullable).toBeFalsy();

        expect(fields.second.type).toBeInstanceOf(GraphQLEnumType);
        expect(fields.second.extensions.nullable).toBeTruthy();
    });

    it('Should apply nullable negative transformations to the schema', () => {
        const transform = new ReplaceConfigTransform({
            config: [
                {
                    typeName: 'TestEnum',
                    fieldName: 'FIRST',
                    nullable: false,
                },
            ] as ReplaceConfigTransformConfig[],
        });

        const wrapped = () => {
            transform.transformSchema(originalSchema, {} as SubschemaConfig);
        };

        expect(wrapped).toThrow(TypeError);
        expect(wrapped).toThrow('Nullable can only be set for InputField and Field.');
    });

    it('Should apply default value positive transformations to the schema', () => {
        const transform = new ReplaceConfigTransform({
            config: [
                {
                    typeName: 'TestInput',
                    fieldName: 'first',
                    defaultValue: 'default',
                },
                {
                    typeName: 'TestInput',
                    fieldName: 'second',
                    defaultValue: 'FIRST',
                },
            ] as ReplaceConfigTransformConfig[],
        });

        const transformedSchema = transform.transformSchema(originalSchema, {} as SubschemaConfig);

        const fields = (transformedSchema.getType('TestInput') as GraphQLObjectType).getFields();

        // @ts-expect-error
        expect((fields.first as GraphQLArgument).defaultValue).toBe('default');
        // @ts-expect-error
        expect((fields.second as GraphQLArgument).defaultValue).toBe('FIRST');
    });

    it('Should apply default value negative transformations to the schema', () => {
        const transform = new ReplaceConfigTransform({
            config: [
                {
                    typeName: 'TestResult',
                    fieldName: 'first',
                    defaultValue: 'test',
                },
            ] as ReplaceConfigTransformConfig[],
        });

        const wrapped = () => {
            transform.transformSchema(originalSchema, {} as SubschemaConfig);
        };

        expect(wrapped).toThrow(TypeError);
        expect(wrapped).toThrow('The default value can only be set for InputField.');
    });

    it('Should apply extensions positive transformations to the schema', () => {
        const transform = new ReplaceConfigTransform({
            config: [
                {
                    typeName: 'TestInput',
                    fieldName: 'first',
                    extensions: {
                        firstExtension: true,
                    },
                },
                {
                    typeName: 'TestInput',
                    fieldName: 'second',
                    extensions: {
                        secondExtension: false,
                    },
                },
            ] as ReplaceConfigTransformConfig[],
        });

        const transformedSchema = transform.transformSchema(originalSchema, {} as SubschemaConfig);

        const fields = (transformedSchema.getType('TestInput') as GraphQLObjectType).getFields();

        expect(fields.first.extensions.firstExtension).toBeTruthy();
        expect(fields.second.extensions.secondExtension).toBeFalsy();
    });

    it('Should apply directives positive transformations to the schema', () => {
        const transform = new ReplaceConfigTransform({
            config: [
                {
                    typeName: 'TestResult',
                    fieldName: 'first',
                    directives: [
                        {
                            name: 'deprecated',
                        },
                    ],
                },
                {
                    typeName: 'TestResult',
                    fieldName: 'second',
                    directives: [
                        {
                            name: 'constraint',
                            args: {
                                minLength: 2,
                                contains: 'test',
                                min: 0.1,
                                required: false,
                                nullable: null,
                                arr: [1, 2],
                            },
                        },
                    ],
                },
            ] as ReplaceConfigTransformConfig[],
        });

        const transformedSchema = transform.transformSchema(originalSchema, {} as SubschemaConfig);

        const fields = (transformedSchema.getType('TestResult') as GraphQLObjectType).getFields();

        expect(fields.first.astNode.directives[0].name.value).toBe('deprecated');
        expect(fields.first.astNode.directives[0].arguments).toHaveLength(0);

        expect(fields.second.astNode.directives[0].name.value).toBe('constraint');

        expect(fields.second.astNode.directives[0].arguments[0].name.value).toBe('minLength');
        expect(fields.second.astNode.directives[0].arguments[0].value.kind).toBe(Kind.INT);
        expect((fields.second.astNode.directives[0].arguments[0].value as IntValueNode).value).toBe(
            '2',
        );

        expect(fields.second.astNode.directives[0].arguments[1].name.value).toBe('contains');
        expect(fields.second.astNode.directives[0].arguments[1].value.kind).toBe(Kind.STRING);
        expect(
            (fields.second.astNode.directives[0].arguments[1].value as StringValueNode).value,
        ).toBe('test');

        expect(fields.second.astNode.directives[0].arguments[2].name.value).toBe('min');
        expect(fields.second.astNode.directives[0].arguments[2].value.kind).toBe(Kind.FLOAT);
        expect(
            (fields.second.astNode.directives[0].arguments[2].value as FloatValueNode).value,
        ).toBe('0.1');

        expect(fields.second.astNode.directives[0].arguments[3].name.value).toBe('required');
        expect(fields.second.astNode.directives[0].arguments[3].value.kind).toBe(Kind.BOOLEAN);
        expect(
            (fields.second.astNode.directives[0].arguments[3].value as BooleanValueNode).value,
        ).toBe(false);

        expect(fields.second.astNode.directives[0].arguments[4].name.value).toBe('nullable');
        expect(fields.second.astNode.directives[0].arguments[4].value.kind).toBe(Kind.NULL);

        expect(fields.second.astNode.directives[0].arguments[5].name.value).toBe('arr');
        expect(fields.second.astNode.directives[0].arguments[5].value.kind).toBe(Kind.STRING);
        expect(
            (fields.second.astNode.directives[0].arguments[5].value as StringValueNode).value,
        ).toBe(JSON.stringify([1, 2]));
    });
});

const buildSchemaFromFile = (filePath: string): GraphQLSchema => {
    // eslint-disable-next-line unicorn/prefer-module
    const schemaPath = path.join(__dirname, filePath);
    const schemaString = fs.readFileSync(schemaPath, 'utf8');
    return buildSchema(schemaString);
};
