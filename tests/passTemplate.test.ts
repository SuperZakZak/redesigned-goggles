import fs from 'fs';
import path from 'path';
import Joi from 'joi';

describe('Apple Wallet pass.json template', () => {
  it('should be valid and contain required fields', () => {
    const templatePath = path.resolve('templates', 'apple', 'loy.pass', 'pass.json');
    const raw = fs.readFileSync(templatePath, 'utf-8');
    const json = JSON.parse(raw);

    const schema = Joi.object({
      formatVersion: Joi.number().valid(1).required(),
      passTypeIdentifier: Joi.string().required(),
      teamIdentifier: Joi.string().required(),
      organizationName: Joi.string().required(),
      description: Joi.string().required(),
      serialNumber: Joi.string().required(),
      backgroundColor: Joi.string().required(),
      foregroundColor: Joi.string().required(),
      labelColor: Joi.string().required(),
      logoText: Joi.string().required(),
      generic: Joi.object({
        primaryFields: Joi.array().required(),
        secondaryFields: Joi.array().required(),
        auxiliaryFields: Joi.array().required(),
      }).required(),
      barcode: Joi.object({
        format: Joi.string().required(),
        message: Joi.string().required(),
        messageEncoding: Joi.string().required(),
      }).required(),
    });

    const { error } = schema.validate(json);
    expect(error).toBeUndefined();
  });
});
