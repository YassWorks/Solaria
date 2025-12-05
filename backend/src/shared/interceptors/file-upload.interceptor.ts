import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { concatMap, Observable } from 'rxjs';
import { diskStorage } from 'multer';
import multer from 'multer';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  constructor(
    private readonly options: {
      fieldName: string;
      destination: string;
      allowedFileTypes: RegExp;
      fileSizeLimit: number;
      defaultPhotoPath?: string;
    },
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const upload = multer({
      storage: diskStorage({
        destination: './uploads/' + this.options.destination,
        filename: (req, file, cb) => {
          cb(
            null,
            `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`,
          );
        },
      }),
      fileFilter: (req, file, cb: any) => {
        if (!file.originalname.match(this.options.allowedFileTypes)) {
          return cb(
            new HttpException(
              'Only PNG, JPEG, and JPG files are allowed',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: this.options.fileSizeLimit },
    }).single(this.options.fieldName);

    return new Observable((observer) => {
      upload(request, response, (err) => {
        if (err)
          observer.error(
            new HttpException(err.message, HttpStatus.BAD_REQUEST),
          );
        else if (request.file)
          request.body[this.options.fieldName] = request.file.path.replace(/\\/g, '/');
        else if (this.options.defaultPhotoPath)
          request.body[this.options.fieldName] = this.options.defaultPhotoPath;

        observer.next(true);
        observer.complete();
      });
    }).pipe(concatMap(() => next.handle()));
  }
}

// Factory function to create the interceptor
export const createFileUploadInterceptor = (options: {
  fieldName: string;
  destination: string;
  allowedFileTypes: RegExp;
  fileSizeLimit: number;
  defaultPhotoPath?: string;
}) => new FileUploadInterceptor(options);
