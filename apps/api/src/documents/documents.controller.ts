import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async getDocuments(@Headers('x-organization-id') orgId?: string) {
    return this.documentsService.getAllDocuments(orgId);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB limit
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-organization-id') orgId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided in form field "file"');
    }
    return this.documentsService.uploadAndProcess(file, orgId);
  }

  @Delete(':id')
  async deleteDocument(
    @Param('id') id: string,
    @Headers('x-organization-id') orgId?: string,
  ) {
    return this.documentsService.deleteDocument(id, orgId);
  }
}

