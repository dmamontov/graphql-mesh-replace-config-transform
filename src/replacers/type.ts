import { GraphQLNonNull, isNonNullType, type GraphQLScalarType, type GraphQLSchema } from 'graphql';
import {
    GraphQLAccountNumber,
    GraphQLBigInt,
    GraphQLByte,
    GraphQLCountryCode,
    GraphQLCuid,
    GraphQLCurrency,
    GraphQLDate,
    GraphQLDateTime,
    GraphQLDateTimeISO,
    GraphQLDeweyDecimal,
    GraphQLDID,
    GraphQLDuration,
    GraphQLEmailAddress,
    GraphQLGUID,
    GraphQLHexadecimal,
    GraphQLHexColorCode,
    GraphQLHSL,
    GraphQLHSLA,
    GraphQLIBAN,
    GraphQLIP,
    GraphQLIPCPatent,
    GraphQLIPv4,
    GraphQLIPv6,
    GraphQLISBN,
    GraphQLISO8601Duration,
    GraphQLJSON,
    GraphQLJSONObject,
    GraphQLJWT,
    GraphQLLatitude,
    GraphQLLCCSubclass,
    GraphQLLocalDate,
    GraphQLLocalDateTime,
    GraphQLLocale,
    GraphQLLocalEndTime,
    GraphQLLocalTime,
    GraphQLLong,
    GraphQLLongitude,
    GraphQLMAC,
    GraphQLNegativeFloat,
    GraphQLNegativeInt,
    GraphQLNonEmptyString,
    GraphQLNonNegativeFloat,
    GraphQLNonNegativeInt,
    GraphQLNonPositiveFloat,
    GraphQLNonPositiveInt,
    GraphQLObjectID,
    GraphQLPhoneNumber,
    GraphQLPort,
    GraphQLPositiveFloat,
    GraphQLPositiveInt,
    GraphQLPostalCode,
    GraphQLRGB,
    GraphQLRGBA,
    GraphQLRoutingNumber,
    GraphQLSafeInt,
    GraphQLSemVer,
    GraphQLSESSN,
    GraphQLTime,
    GraphQLTimestamp,
    GraphQLTimeZone,
    GraphQLUnsignedFloat,
    GraphQLUnsignedInt,
    GraphQLURL,
    GraphQLUSCurrency,
    GraphQLUtcOffset,
    GraphQLUUID,
    GraphQLVoid,
} from 'graphql-scalars';
import { addTypes } from '@graphql-tools/utils';
import {
    FieldType,
    type ReplaceConfigReplacersTransformConfig,
    type ReplaceConfigReplacerTypeTransformConfig,
    type ReplaceFieldConfig,
} from '../types';
import { BaseReplacer } from './base';

export class TypeReplacer extends BaseReplacer {
    protected scalars: GraphQLScalarType[] = [
        GraphQLDate,
        GraphQLTime,
        GraphQLDateTime,
        GraphQLDateTimeISO,
        GraphQLTimestamp,
        GraphQLTimeZone,
        GraphQLUtcOffset,
        GraphQLDuration,
        GraphQLISO8601Duration,
        GraphQLLocalDate,
        GraphQLLocalTime,
        GraphQLLocalDateTime,
        GraphQLLocalEndTime,
        GraphQLEmailAddress,
        GraphQLNegativeFloat,
        GraphQLNegativeInt,
        GraphQLNonEmptyString,
        GraphQLNonNegativeFloat,
        GraphQLNonNegativeInt,
        GraphQLNonPositiveFloat,
        GraphQLNonPositiveInt,
        GraphQLPhoneNumber,
        GraphQLPositiveFloat,
        GraphQLPositiveInt,
        GraphQLPostalCode,
        GraphQLUnsignedFloat,
        GraphQLUnsignedInt,
        GraphQLURL,
        GraphQLBigInt,
        GraphQLByte,
        GraphQLLong,
        GraphQLSafeInt,
        GraphQLUUID,
        GraphQLGUID,
        GraphQLHexadecimal,
        GraphQLHexColorCode,
        GraphQLHSL,
        GraphQLHSLA,
        GraphQLIP,
        GraphQLIPv4,
        GraphQLIPv6,
        GraphQLISBN,
        GraphQLJWT,
        GraphQLLatitude,
        GraphQLLongitude,
        GraphQLMAC,
        GraphQLPort,
        GraphQLRGB,
        GraphQLRGBA,
        GraphQLUSCurrency,
        GraphQLCurrency,
        GraphQLJSON,
        GraphQLJSONObject,
        GraphQLIBAN,
        GraphQLObjectID,
        GraphQLVoid,
        GraphQLDID,
        GraphQLCountryCode,
        GraphQLLocale,
        GraphQLRoutingNumber,
        GraphQLAccountNumber,
        GraphQLCuid,
        GraphQLSemVer,
        GraphQLSESSN,
        GraphQLDeweyDecimal,
        GraphQLLCCSubclass,
        GraphQLIPCPatent,
    ];

    protected asType: any;

    extendScheme(schema: GraphQLSchema): GraphQLSchema {
        let newSchema = schema;
        const type = (this.options as ReplaceConfigReplacerTypeTransformConfig).type;
        this.asType = newSchema.getType(type);

        if (!this.asType) {
            this.asType = this.scalars.find(scalar => scalar.name === type);

            if (this.asType) {
                newSchema = addTypes(newSchema, [this.asType]);
            }
        }

        return newSchema;
    }

    modifySchema(fieldConfig: ReplaceFieldConfig, type: FieldType): ReplaceFieldConfig {
        if (!this.asType) {
            throw new TypeError('Type not found');
        }

        if (![FieldType.Composite, FieldType.Input, FieldType.Argument].includes(type)) {
            return fieldConfig;
        }

        return {
            ...fieldConfig,
            type: isNonNullType((fieldConfig as any).type)
                ? new GraphQLNonNull(this.asType)
                : this.asType,
        } as ReplaceFieldConfig;
    }
}

export const createTypeReplacer = (options: ReplaceConfigReplacersTransformConfig) => {
    return new TypeReplacer(options);
};
