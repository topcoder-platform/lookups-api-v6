import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
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
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { UserRoles, Scopes as AppScopes } from '../../app-constants';
import { setPaginationHeaders } from '../../common/pagination.helper';
import { Prisma } from '@prisma/client';

@ApiTags('Countries')
@Controller('lookups/countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Roles(UserRoles.Admin)
  @Scopes(AppScopes.CreateLookup, AppScopes.AllLookup)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new country' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Country created successfully' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCountryDto: CreateCountryDto) {
    return this.countriesService.create(createCountryDto);
  }

  @Get()
  @ApiOperation({ summary: 'List countries with filtering and pagination' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'perPage', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by country name' })
  @ApiQuery({ name: 'countryCode', required: false, type: String, description: 'Filter by country code' })
  @ApiQuery({ name: 'includeSoftDeleted', required: false, type: Boolean, description: 'Include soft-deleted records (admin only)' })
  async findAll(
    @Req() req: any,
    @Res() res: Response,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
    @Query('name') name?: string,
    @Query('countryCode') countryCode?: string,
    @Query('includeSoftDeleted', new DefaultValuePipe(false), ParseBoolPipe) includeSoftDeleted?: boolean,
  ) {
    const isAdmin = req.authUser?.roles?.includes(UserRoles.Admin) || req.authUser?.scopes?.includes(AppScopes.AllLookup);

    if (includeSoftDeleted && !isAdmin) {
      throw new ForbiddenException('You are not allowed to perform this action.');
    }

    if (page * perPage >= 10000) {
      throw new BadRequestException('You cannot fetch more than 10,000 records at a time');
    }

    const where: Prisma.CountryWhereInput = { name, countryCode };
    if (!includeSoftDeleted) {
      where.isDeleted = false;
    }

    const { total, data } = await this.countriesService.findAll({
      skip: (page - 1) * perPage,
      take: perPage,
      where,
      orderBy: { name: 'asc' },
    });
    setPaginationHeaders(res, req, total, page, perPage);
    return res.send(data);
  }

  @Head()
  @ApiOperation({ summary: 'Get headers for countries list' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'perPage', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by country name' })
  @ApiQuery({ name: 'countryCode', required: false, type: String, description: 'Filter by country code' })
  @ApiQuery({ name: 'includeSoftDeleted', required: false, type: Boolean, description: 'Include soft-deleted records (admin only)' })
  @HttpCode(HttpStatus.OK)
  async findAllHead(
    @Req() req: any,
    @Res() res: Response,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
    @Query('name') name?: string,
    @Query('countryCode') countryCode?: string,
    @Query('includeSoftDeleted', new DefaultValuePipe(false), ParseBoolPipe) includeSoftDeleted?: boolean,
  ) {
    const isAdmin = req.authUser?.roles?.includes(UserRoles.Admin) || req.authUser?.scopes?.includes(AppScopes.AllLookup);

    if (includeSoftDeleted && !isAdmin) {
      throw new ForbiddenException('You are not allowed to perform this action.');
    }

    const where: Prisma.CountryWhereInput = { name, countryCode };
    if (!includeSoftDeleted) {
      where.isDeleted = false;
    }

    const { total } = await this.countriesService.findAll({ where });

    setPaginationHeaders(res, req, total, page, perPage);
    res.end();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a country by ID' })
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
    return this.countriesService.findOne(id, includeSoftDeleted && isAdmin);
  }

  @Head(':id')
  @ApiOperation({ summary: 'Get headers for a country by ID' })
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

    await this.countriesService.findOne(id, includeSoftDeleted && isAdmin);
    return;
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRoles.Admin)
  @Scopes(AppScopes.UpdateLookup, AppScopes.AllLookup)
  @ApiOperation({ summary: 'Update a country (full update)' })
  @ApiBearerAuth()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createCountryDto: CreateCountryDto,
  ) {
    return this.countriesService.update(id, createCountryDto);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRoles.Admin)
  @Scopes(AppScopes.UpdateLookup, AppScopes.AllLookup)
  @ApiOperation({ summary: 'Partially update a country' })
  @ApiBearerAuth()
  async partiallyUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCountryDto: UpdateCountryDto,
  ) {
    return this.countriesService.partiallyUpdate(id, updateCountryDto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRoles.Admin)
  @Scopes(AppScopes.DeleteLookup, AppScopes.AllLookup)
  @ApiOperation({ summary: 'Remove a country (soft or hard delete)' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'destroy', required: false, type: Boolean, description: 'Perform hard delete if true' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('destroy', new DefaultValuePipe(false), ParseBoolPipe) destroy: boolean,
  ) {
    await this.countriesService.remove(id, destroy);
  }
}
