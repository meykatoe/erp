import { BadRequestException } from '@nestjs/common';

export type Transitions<S extends string> = Record<S, S[]>;

export function canTransition<S extends string>(map: Transitions<S>, from: S, to: S) {
  return map[from].includes(to);
}

export function assertTransition<S extends string>(
  map: Transitions<S>,
  from: S,
  to: S,
  label = '單據',
) {
  if (!canTransition(map, from, to)) {
    throw new BadRequestException(`${label}狀態不可由 ${from} 變更為 ${to}`);
  }
}
