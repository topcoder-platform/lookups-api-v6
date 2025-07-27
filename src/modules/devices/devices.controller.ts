import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  ParseUUIDPipe,
  UseGuards,
  Put,
  ParseBoolPipe,
  HttpCode,
  HttpStatus,
  Head,
  Res,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { UserRoles, Scopes as AppScopes } from '../../app-constants';
import { setPaginationHeaders } from '../../common/pagination.helper';
import { Prisma } from '@prisma/client';

@ApiTags('Devices')
@Controller('lookups/devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Roles(UserRoles.Admin)
  @Scopes(AppScopes.CreateLookup, AppScopes.AllLookup)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new device' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Device created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'List devices with filtering and pagination' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'perPage', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by device type' })
  @ApiQuery({ name: 'manufacturer', required: false, type: String, description: 'Filter by manufacturer' })
  @ApiQuery({ name: 'model', required: false, type: String, description: 'Filter by model' })
  @ApiQuery({ name: 'operatingSystem', required: false, type: String, description: 'Filter by operating system' })
  @ApiQuery({ name: 'operatingSystemVersion', required: false, type: String, description: 'Filter by operating system version' })
  @ApiQuery({ name: 'includeSoftDeleted', required: false, type: Boolean, description: 'Include soft-deleted records (admin only)' })
  async findAll(
    @Req() req: any,
    @Res() res: Response,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
    @Query('type') type?: string,
    @Query('manufacturer') manufacturer?: string,
    @Query('model') model?: string,
    @Query('operatingSystem') operatingSystem?: string,
    @Query('operatingSystemVersion') operatingSystemVersion?: string,
    @Query('includeSoftDeleted', new DefaultValuePipe(false), ParseBoolPipe) includeSoftDeleted?: boolean,
  ) {
    const isAdmin = req.authUser?.roles?.includes(UserRoles.Admin) || req.authUser?.scopes?.includes(AppScopes.AllLookup);

    if (includeSoftDeleted && !isAdmin) {
      throw new ForbiddenException('You are not allowed to perform this action.');
    }

    if (page * perPage >= 10000) {
      throw new BadRequestException('You cannot fetch more than 10,000 records at a time');
    }

    const where: Prisma.DeviceWhereInput = {
      type,
      manufacturer,
      model,
      operatingSystem,
      operatingSystemVersion,
    };
    if (!includeSoftDeleted) {
      where.isDeleted = false;
    }

    const { total, data } = await this.devicesService.findAll(
      {
        skip: (page - 1) * perPage,
        take: perPage,
        where,
        orderBy: { type: 'asc' },
      },
    );

    setPaginationHeaders(res, req, total, page, perPage);
    return res.send(data);
  }

  @Head()
  @ApiOperation({ summary: 'Get headers for devices list' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'perPage', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by device type' })
  @ApiQuery({ name: 'manufacturer', required: false, type: String, description: 'Filter by manufacturer' })
  @ApiQuery({ name: 'model', required: false, type: String, description: 'Filter by model' })
  @ApiQuery({ name: 'operatingSystem', required: false, type: String, description: 'Filter by operating system' })
  @ApiQuery({ name: 'operatingSystemVersion', required: false, type: String, description: 'Filter by operating system version' })
  @ApiQuery({ name: 'includeSoftDeleted', required: false, type: Boolean, description: 'Include soft-deleted records (admin only)' })
  @HttpCode(HttpStatus.OK)
  async findAllHead(
    @Req() req: any,
    @Res() res: Response,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
    @Query('type') type?: string,
    @Query('manufacturer') manufacturer?: string,
    @Query('model') model?: string,
    @Query('operatingSystem') operatingSystem?: string,
    @Query('operatingSystemVersion') operatingSystemVersion?: string,
    @Query('includeSoftDeleted', new DefaultValuePipe(false), ParseBoolPipe) includeSoftDeleted?: boolean,
  ) {
    const isAdmin = req.authUser?.roles?.includes(UserRoles.Admin) || req.authUser?.scopes?.includes(AppScopes.AllLookup);

    if (includeSoftDeleted && !isAdmin) {
      throw new ForbiddenException('You are not allowed to perform this action.');
    }

    const where: Prisma.DeviceWhereInput = {
      type,
      manufacturer,
      model,
      operatingSystem,
      operatingSystemVersion,
    };
    if (!includeSoftDeleted) {
      where.isDeleted = false;
    }

    const { total } = await this.devicesService.findAll(
      {
        where,
      }
    );

    setPaginationHeaders(res, req, total, page, perPage);
    res.end();
  }

  @Get('types')
  @ApiOperation({ summary: 'Get distinct device types' })
  @ApiBearerAuth()
  async getTypes() {
    return this.devicesService.getTypes();
  }

  @Get('manufacturers')
  @ApiOperation({ summary: 'Get distinct device manufacturers' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by device type' })
  async getManufacturers(@Query('type') type?: string) {
    return this.devicesService.getManufacturers(type);
  }

  @Get('models')
  @ApiOperation({ summary: 'Get distinct device models' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by device type' })
  @ApiQuery({ name: 'manufacturer', required: false, type: String, description: 'Filter by manufacturer' })
  async getDeviceModels(
    @Query('type') type?: string,
    @Query('manufacturer') manufacturer?: string,
  ) {
    return this.devicesService.getDeviceModels(type, manufacturer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a device by ID' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'includeSoftDeleted', required: false, type: Boolean, description: 'Include soft-deleted record (admin only)' })
  async findOne(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeSoftDeleted', new DefaultValuePipe(false), ParseBoolPipe) includeSoftDeleted: boolean,
  ) {
    const isAdmin = req.authUser?.roles?.includes(UserRoles.Admin) || req.authUser?.scopes?.includes(AppScopes.AllLookup);

    if (includeSoftDeleted && !isAdmin) {
      throw new ForbiddenException('You are not allowed to perform this action.');
    }

    return this.devicesService.findOne(id, includeSoftDeleted && isAdmin);
  }

  @Head(':id')
  @ApiOperation({ summary: 'Get headers for a device by ID' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'includeSoftDeleted', required: false, type: Boolean, description: 'Include soft-deleted record (admin only)' })
  @HttpCode(HttpStatus.OK)
  async findOneHead(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeSoftDeleted', new DefaultValuePipe(false), ParseBoolPipe) includeSoftDeleted: boolean,
  ) {
    const isAdmin = req.authUser?.roles?.includes(UserRoles.Admin) || req.authUser?.scopes?.includes(AppScopes.AllLookup);

    if (includeSoftDeleted && !isAdmin) {
      throw new ForbiddenException('You are not allowed to perform this action.');
    }

    await this.devicesService.findOne(id, includeSoftDeleted && isAdmin);
    return;
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRoles.Admin)
  @Scopes(AppScopes.UpdateLookup, AppScopes.AllLookup)
  @ApiOperation({ summary: 'Update a device (full update)' })
  @ApiBearerAuth()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createDeviceDto: CreateDeviceDto,
  ) {
    return this.devicesService.update(id, createDeviceDto);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRoles.Admin)
  @Scopes(AppScopes.UpdateLookup, AppScopes.AllLookup)
  @ApiOperation({ summary: 'Partially update a device' })
  @ApiBearerAuth()
  async partiallyUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.devicesService.partiallyUpdate(id, updateDeviceDto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRoles.Admin)
  @Scopes(AppScopes.DeleteLookup, AppScopes.AllLookup)
  @ApiOperation({ summary: 'Remove a device (soft or hard delete)' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'destroy', required: false, type: Boolean, description: 'Perform hard delete if true' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('destroy', new DefaultValuePipe(false), ParseBoolPipe) destroy: boolean,
  ) {
    await this.devicesService.remove(id, destroy);
  }
}
