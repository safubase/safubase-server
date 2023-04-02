'use strict';

// MODULES
import validator from 'validator';

// CONFIG
import config from '../config';

export function validate_base64(base64: string, err: any): void {
  if (typeof base64 !== config.types.string) {
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
  const file_ext: string = base64_type.split('/')[1];

  if (!validator.isBase64(base64) && !validator.isBase64(base64_data)) {
    throw { message: 'Invalid base64 string', type: `${err.section}:${err.type}` };
  }

  if (!base64_type || !base64_data || !file_ext) {
    throw { message: 'Invalid image file type (base64)', type: `${err.section}:${err.type}` };
  }

  // TODO improve
  if (!base64_type.includes('image/png') && !base64_type.includes('image/jpg') && !base64_type.includes('image/jpeg')) {
    throw { message: 'Invalid image file type, acceptables (png, jpg, jpeg)', type: `${err.section}:${err.type}` };
  }
}

export function remove_extra_space(str: string): string {
  if (!str || typeof str !== config.types.string) {
    return '';
  }

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

  return '';
}

export function str_remove_extra_space(str: string): string {
  if (!str || typeof str !== config.types.string) {
    return '';
  }

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

  return '';
}

export function random({ length = 32, type = 'hex' }): string {
  let final: string = '';
  let buffer: string = '';

  if (type === 'hex') {
    buffer = '0123456789abcdef';
  }

  if (type === 'url-safe') {
    buffer = '0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM-';
  }

  if (type === 'distinguishable') {
    buffer = 'QWERTYUIOPASDFGHJKLZXCVBNM';
  }

  if (type === 'numeric') {
    buffer = '0123456789';
  }

  for (let i: number = 0; i < length; i++) {
    const rand = Math.floor(Math.random() * buffer.length);
    final = final + buffer[rand];
  }

  return final;
}

export default {
  remove_extra_space,
  str_remove_extra_space,
  validate_base64,
  random,
};

//test
