import { SetMetadata } from '@nestjs/common';

export const PERMS_KEY = 'permissions';
export const Perm = (...perms: string[]) => SetMetadata(PERMS_KEY, perms);
