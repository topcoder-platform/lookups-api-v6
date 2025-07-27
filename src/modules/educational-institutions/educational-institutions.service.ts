import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEducationalInstitutionDto } from './dto/create-educational-institution.dto';
import { UpdateEducationalInstitutionDto } from './dto/update-educational-institution.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EducationalInstitutionsService {
  constructor(private prisma: PrismaService) {}

  create(createDto: CreateEducationalInstitutionDto) {
    return this.prisma.educationalInstitution.create({ data: createDto });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.EducationalInstitutionWhereInput;
    orderBy?: Prisma.EducationalInstitutionOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.educationalInstitution.count({ where }),
      this.prisma.educationalInstitution.findMany({ skip, take, where, orderBy }),
    ]);
    return { total, data };
  }

  async findOne(id: string, includeSoftDeleted = false) {
    const where: Prisma.EducationalInstitutionWhereInput = { id };
    if (!includeSoftDeleted) {
      where.isDeleted = false;
    }
    const institution = await this.prisma.educationalInstitution.findFirst({
      where,
    });
    if (!institution) {
      throw new NotFoundException(`Educational Institution with ID "${id}" not found`);
    }
    return institution;
  }

  async update(id: string, createDto: CreateEducationalInstitutionDto) {
    await this.findOne(id);
    return this.prisma.educationalInstitution.update({ where: { id }, data: createDto });
  }

  async partiallyUpdate(id: string, updateDto: UpdateEducationalInstitutionDto) {
    await this.findOne(id);
    return this.prisma.educationalInstitution.update({ where: { id }, data: updateDto });
  }

  async remove(id: string, destroy: boolean = false) {
    // Ensure the record exists before trying to delete/update it.
    await this.findOne(id);

    if (destroy) {
      // Hard delete the record from the database
      return this.prisma.educationalInstitution.delete({ where: { id } });
    }

    // Soft delete the record by setting the isDeleted flag
    return this.prisma.educationalInstitution.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
