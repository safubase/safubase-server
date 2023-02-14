'use strict';

// MODULES
import validator from 'validator';

// CONFIG
import config from '../config';

export function validate_base64(base64: string, err: any): void {
  const types = config.types;

  if (typeof base64 !== types.string) {
    throw { message: 'Logo is invalid type', type: `${err.section}:${err.type}` };
  }

  if (base64.length > 1000000) {
    throw { message: 'Logo is too big, 1mb max', type: `${err.section}:${err.type}` };
  }

  if (!base64.startsWith('data:image/png;base64,') && !base64.startsWith('data:image/jpg;base64,') && !base64.startsWith('data:image/jpeg;base64,')) {
    throw { message: 'Invalid image file type (starts with data:image/{ext};base64,', type: `${err.section}:${err.type}` };
  }

  const base64_parts: string[] = base64.split(';base64,');
  const base64_type: string = base64_parts[0];
  const base64_data: string = base64_parts[1];
  const fileExt: string = base64_type.split('/')[1];

  if (!validator.isBase64(base64) && !validator.isBase64(base64_data)) {
    throw { message: 'Invalid base64 string', type: `${err.section}:${err.type}` };
  }

  if (!base64_type || !base64_data || !fileExt) {
    throw { message: 'Invalid image file type (base64)', type: `${err.section}:${err.type}` };
  }

  // TODO improve
  if (!base64_type.includes('image/png') && !base64_type.includes('image/jpg') && !base64_type.includes('image/jpeg')) {
    throw { message: 'Invalid image file type, acceptables (png, jpg, jpeg)', type: `${err.section}:${err.type}` };
  }
}

export function remove_extra_space(str: string, mode: number = 0): string {
  if (!str || typeof str !== config.types.string) {
    return '';
  }

  if (typeof mode === config.types.number) {
    throw new Error('Invalid mode argument provided in remove_extra_space');
  }

  if (mode === 0) {
    let new_str: string = '';

    for (let i: number = 0; i < str.length; i++) {
      const current: string = str[i];
      const next: string | undefined = str[i + 1];

      if (current === ' ') {
        if (next && next !== ' ') {
          if (new_str.length) {
            new_str = new_str + current;
          }
        }
      } else {
        new_str = new_str + current;
      }
    }

    return new_str;
  }

  if (mode === 1) {
    return str.replace(/\s/g, ' ');
  }

  return '';
}

export default {
  remove_extra_space,
  validate_base64,
};
