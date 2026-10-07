import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { STORAGE_SERVICE } from './storage.interface';
import { LocalStorageService } from './local-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STORAGE_SERVICE,
      useClass: LocalStorageService,
    },
    LocalStorageService,
  ],
  exports: [STORAGE_SERVICE, LocalStorageService],
})
export class StorageModule {}

