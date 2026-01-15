import { SetMetadata } from '@nestjs/common';

export const IgnoreLogging = () => SetMetadata('ignoreLogging', true);