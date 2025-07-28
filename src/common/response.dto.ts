import { Exclude } from 'class-transformer';

export class ResponseDTO {
  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  isDeleted: boolean;
}
