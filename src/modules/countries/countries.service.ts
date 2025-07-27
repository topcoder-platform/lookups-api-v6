import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CountriesService {
  constructor(private prisma: PrismaService) {}

  create(createCountryDto: CreateCountryDto) {
    return this.prisma.country.create({
      data: createCountryDto,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CountryWhereInput;
    orderBy?: Prisma.CountryOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.country.count({ where }),
      this.prisma.country.findMany({ skip, take, where, orderBy }),
    ]);
    return { total, data };
  }

  async findOne(id: string, includeSoftDeleted: boolean = false) {
    const where: Prisma.CountryWhereInput = { id };
    if (!includeSoftDeleted) {
      where.isDeleted = false;
    }

    const country = await this.prisma.country.findFirst({ where });
    if (!country) {
      throw new NotFoundException(`Country with ID "${id}" not found`);
    }
    return country;
  }

  async update(id: string, createCountryDto: CreateCountryDto) {
    await this.findOne(id);
    return this.prisma.country.update({ where: { id }, data: createCountryDto });
  }

  async partiallyUpdate(id: string, updateCountryDto: UpdateCountryDto) {
    await this.findOne(id);
    return this.prisma.country.update({ where: { id }, data: updateCountryDto });
  }

  async remove(id: string, destroy: boolean = false) {
    // Ensure the record exists before trying to delete/update it.
    await this.findOne(id);

    if (destroy) {
      // Hard delete the record from the database
      return this.prisma.country.delete({ where: { id } });
    }

    // Soft delete the record by setting the isDeleted flag
    return this.prisma.country.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
