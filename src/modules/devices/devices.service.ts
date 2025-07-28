import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  create(createDeviceDto: CreateDeviceDto) {
    return this.prisma.device.create({
      data: createDeviceDto,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.DeviceWhereInput;
    orderBy?: Prisma.DeviceOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.device.count({ where }),
      this.prisma.device.findMany({ skip, take, where, orderBy }),
    ]);
    return { total, data };
  }

  async findOne(id: string, includeSoftDeleted = false) {
    const where: Prisma.DeviceWhereInput = { id };
    if (!includeSoftDeleted) {
      where.isDeleted = false;
    }
    const device = await this.prisma.device.findFirst({
      where,
    });
    if (!device) {
      throw new NotFoundException(`Device with ID "${id}" not found`);
    }
    return device;
  }

  async update(id: string, createDeviceDto: CreateDeviceDto) {
    await this.findOne(id);
    return this.prisma.device.update({ where: { id }, data: createDeviceDto });
  }

  async partiallyUpdate(id: string, updateDeviceDto: UpdateDeviceDto) {
    await this.findOne(id);
    return this.prisma.device.update({ where: { id }, data: updateDeviceDto });
  }

  async remove(id: string, destroy: boolean = false) {
    // Ensure the record exists before trying to delete/update it.
    await this.findOne(id);

    if (destroy) {
      // Hard delete the record from the database
      return this.prisma.device.delete({ where: { id } });
    }

    // Soft delete the record by setting the isDeleted flag
    return this.prisma.device.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async getTypes(): Promise<string[]> {
    const distinctTypes = await this.prisma.device.findMany({
      where: { isDeleted: false },
      select: { type: true },
      distinct: ['type'],
    });
    return distinctTypes.map((d) => d.type);
  }

  async getManufacturers(type?: string): Promise<string[]> {
    const whereClause: Prisma.DeviceWhereInput = { isDeleted: false };
    if (type) {
      whereClause.type = type;
    }
    const distinctManufacturers = await this.prisma.device.findMany({
      where: whereClause,
      select: { manufacturer: true },
      distinct: ['manufacturer'],
    });
    return distinctManufacturers.map((d) => d.manufacturer);
  }

  async getDeviceModels(
    type?: string,
    manufacturer?: string,
  ): Promise<string[]> {
    const whereClause: Prisma.DeviceWhereInput = { isDeleted: false };
    if (type) {
      whereClause.type = type;
    }
    if (manufacturer) {
      whereClause.manufacturer = manufacturer;
    }
    const distinctModels = await this.prisma.device.findMany({
      where: whereClause,
      select: { model: true },
      distinct: ['model'],
    });
    return distinctModels.map((d) => d.model);
  }
}
