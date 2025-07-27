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
import { EducationalInstitutionsService } from './educational-institutions.service';
import { CreateEducationalInstitutionDto } from './dto/create-educational-institution.dto';
import { UpdateEducationalInstitutionDto } from './dto/update-educational-institution.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { UserRoles, Scopes as AppScopes } from '../../app-constants';
import { setPaginationHeaders } from '../../common/pagination.helper';
import { Prisma } from '@prisma/client';

@ApiTags('Educational Institutions')
@Controller('lookups/educationalInstitutions')
export class EducationalInstitutionsController {
  constructor(
    private readonly educationalInstitutionsService: EducationalInstitutionsService,
  ) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Roles(UserRoles.Admin)
  @Scopes(AppScopes.CreateLookup, AppScopes.AllLookup)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new educational institution' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Educational institution created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateEducationalInstitutionDto) {
    return this.educationalInstitutionsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List educational institutions with filtering and pagination' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'perPage', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by institution name' })
  @ApiQuery({ name: 'includeSoftDeleted', required: false, type: Boolean, description: 'Include soft-deleted records (admin only)' })
  async findAll(
    @Req() req: any,
    @Res() res: Response,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
    @Query('name') name?: string,
    @Query('includeSoftDeleted', new DefaultValuePipe(false), ParseBoolPipe) includeSoftDeleted?: boolean,
  ) {
    const isAdmin = req.authUser?.roles?.includes(UserRoles.Admin) || req.authUser?.scopes?.includes(AppScopes.AllLookup);

    if (includeSoftDeleted && !isAdmin) {
      throw new ForbiddenException('You are not allowed to perform this action.');
    }

    if (page * perPage >= 10000) {
      throw new BadRequestException('You cannot fetch more than 10,000 records at a time');
    }

    const where: Prisma.EducationalInstitutionWhereInput = { name };
    if (!includeSoftDeleted) {
      where.isDeleted = false;
    }

    const { total, data } = await this.educationalInstitutionsService.findAll(
      {
        skip: (page - 1) * perPage,
        take: perPage,
        where,
        orderBy: { name: 'asc' },
      }
    );

    setPaginationHeaders(res, req, total, page, perPage);
    return res.send(data);
  }

  @Head()
  @ApiOperation({ summary: 'Get headers for educational institutions list' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'perPage', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by institution name' })
  @ApiQuery({ name: 'includeSoftDeleted', required: false, type: Boolean, description: 'Include soft-deleted records (admin only)' })
  @HttpCode(HttpStatus.OK)
  async findAllHead(
    @Req() req: any,
    @Res() res: Response,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(20), ParseIntPipe) perPage: number,
    @Query('name') name?: string,
    @Query('includeSoftDeleted', new DefaultValuePipe(false), ParseBoolPipe) includeSoftDeleted?: boolean,
  ) {
    const isAdmin = req.authUser?.roles?.includes(UserRoles.Admin) || req.authUser?.scopes?.includes(AppScopes.AllLookup);

    if (includeSoftDeleted && !isAdmin) {
      throw new ForbiddenException('You are not allowed to perform this action.');
    }

    const where: Prisma.EducationalInstitutionWhereInput = { name };
    if (!includeSoftDeleted) {
      where.isDeleted = false;
    }

    const { total } = await this.educationalInstitutionsService.findAll(
      {
        where,
      }
    );

    setPaginationHeaders(res, req, total, page, perPage);
    res.end();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an educational institution by ID' })
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

    return this.educationalInstitutionsService.findOne(id, includeSoftDeleted && isAdmin);
  }

  @Head(':id')
  @ApiOperation({ summary: 'Get headers for an educational institution by ID' })
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

    await this.educationalInstitutionsService.findOne(id, includeSoftDeleted && isAdmin);
    return;
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRoles.Admin)
  @Scopes(AppScopes.UpdateLookup, AppScopes.AllLookup)
  @ApiOperation({ summary: 'Update an educational institution (full update)' })
  @ApiBearerAuth()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createDto: CreateEducationalInstitutionDto,
  ) {
    return this.educationalInstitutionsService.update(id, createDto);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRoles.Admin)
  @Scopes(AppScopes.UpdateLookup, AppScopes.AllLookup)
  @ApiOperation({ summary: 'Partially update an educational institution' })
  @ApiBearerAuth()
  async partiallyUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateEducationalInstitutionDto,
  ) {
    return this.educationalInstitutionsService.partiallyUpdate(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Roles(UserRoles.Admin)
  @Scopes(AppScopes.DeleteLookup, AppScopes.AllLookup)
  @ApiOperation({ summary: 'Remove an educational institution (soft or hard delete)' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'destroy', required: false, type: Boolean, description: 'Perform hard delete if true' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('destroy', new DefaultValuePipe(false), ParseBoolPipe) destroy: boolean,
  ) {
    await this.educationalInstitutionsService.remove(id, destroy);
  }
}
