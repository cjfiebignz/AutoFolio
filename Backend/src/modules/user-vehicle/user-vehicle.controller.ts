import { Controller, Get, Post, Body, Param, Patch, Delete, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, BadRequestException, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UserVehicleService } from './user-vehicle.service';
import { CreateUserVehicleDto } from './dto/create-user-vehicle.dto';
import { UpdateUserVehicleDto } from './dto/update-user-vehicle.dto';
import { CreateServiceEventDto } from './dto/create-service-event.dto';
import { UpdateServiceEventDto } from './dto/update-service-event.dto';
import { CreateWorkJobDto } from './dto/create-work-job.dto';
import { UpdateWorkJobDto } from './dto/update-work-job.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { CreateInsuranceDto } from './dto/create-insurance.dto';
import { UpdateInsuranceDto } from './dto/update-insurance.dto';
import { CreateCustomSpecDto } from './dto/create-custom-spec.dto';
import { UpdateCustomSpecDto } from './dto/update-custom-spec.dto';
import { UpdateBannerMetadataDto } from './dto/update-banner-metadata.dto';

@Controller('user-vehicles')
export class UserVehicleController {
  constructor(private readonly userVehicleService: UserVehicleService) {}

  @Post()
  async create(@Body() createUserVehicleDto: CreateUserVehicleDto) {
    return this.userVehicleService.create(createUserVehicleDto);
  }

  @Get('user/:userId')
  async findAllByUser(@Param('userId') userId: string) {
    return this.userVehicleService.findAllByUser(userId);
  }

  @Get(':id/specs')
  async getVehicleSpecs(@Param('id') id: string) {
    return this.userVehicleService.getVehicleWithSpecs(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userVehicleService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserVehicleDto: UpdateUserVehicleDto) {
    return this.userVehicleService.update(id, updateUserVehicleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userVehicleService.remove(id);
  }

  @Get(':id/service-summary')
  async getServiceSummary(@Param('id') id: string) {
    return this.userVehicleService.getServiceSummary(id);
  }

  @Get(':id/cost-summary')
  async getLifetimeCostSummary(@Param('id') id: string) {
    return this.userVehicleService.getLifetimeCostSummary(id);
  }
  @Get(':id/export-history')
  async exportHistory(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.userVehicleService.exportVehicleHistory(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="vehicle-history.pdf"`);

    doc.pipe(res);
  }

  @Get(':id/export-service-history')
  async exportServiceHistory(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.userVehicleService.exportServiceHistory(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="service-history.pdf"`);
    doc.pipe(res);
  }

  @Get(':id/export-work-history')
  async exportWorkHistory(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.userVehicleService.exportWorkHistory(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="work-history.pdf"`);
    doc.pipe(res);
  }

  @Get(':id/export-documents-zip')
  async exportDocumentsZip(@Param('id') id: string, @Res() res: Response) {
    const { archive, vehicleName } = await this.userVehicleService.exportDocumentsZip(id);
    
    const safeName = vehicleName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="autofolio-${safeName}-documents.zip"`);
    
    archive.pipe(res);
  }

  @Post(':id/export-documents-zip')
  async exportSelectedDocumentsZip(
    @Param('id') id: string, 
    @Body('documentIds') documentIds: string[],
    @Res() res: Response
  ) {
    const { archive, vehicleName } = await this.userVehicleService.exportDocumentsZip(id, documentIds);
    
    const safeName = vehicleName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="autofolio-${safeName}-documents.zip"`);
    
    archive.pipe(res);
  }

  @Post(':id/public-report/enable')
  async enablePublicReport(@Param('id') id: string) {
    return this.userVehicleService.enablePublicReport(id);
  }

  @Post(':id/public-report/disable')
  async disablePublicReport(@Param('id') id: string) {
    return this.userVehicleService.disablePublicReport(id);
  }

  // --- SERVICE EVENTS ---

  @Post(':id/services')
  async createService(@Param('id') id: string, @Body() createServiceEventDto: CreateServiceEventDto) {
    return this.userVehicleService.createServiceEvent(id, createServiceEventDto);
  }

  @Get(':id/services/:serviceId')
  async findOneService(@Param('id') id: string, @Param('serviceId') serviceId: string) {
    return this.userVehicleService.findOneServiceEvent(id, serviceId);
  }

  @Patch(':id/services/:serviceId')
  async updateService(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
    @Body() updateServiceEventDto: UpdateServiceEventDto,
  ) {
    return this.userVehicleService.updateServiceEvent(id, serviceId, updateServiceEventDto);
  }

  @Delete(':id/services/:serviceId')
  async removeServiceEvent(@Param('id') id: string, @Param('serviceId') serviceId: string) {
    return this.userVehicleService.removeServiceEvent(id, serviceId);
  }

  @Post(':id/services/:serviceId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  async addServiceAttachment(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }
    return this.userVehicleService.addServiceAttachment(serviceId, file);
  }

  @Delete(':id/services/:serviceId/attachments/:attachmentId')
  async removeServiceAttachment(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.userVehicleService.removeServiceAttachment(serviceId, attachmentId);
  }

  // --- REGISTRATION ---

  @Post(':id/registrations')
  async createRegistration(@Param('id') id: string, @Body() dto: CreateRegistrationDto) {
    return this.userVehicleService.createRegistration(id, dto);
  }

  @Get(':id/registrations')
  async findAllRegistrations(@Param('id') id: string) {
    return this.userVehicleService.findAllRegistrations(id);
  }

  @Patch(':id/registrations/:regId')
  async updateRegistration(
    @Param('id') id: string,
    @Param('regId') regId: string,
    @Body() dto: UpdateRegistrationDto,
  ) {
    return this.userVehicleService.updateRegistration(id, regId, dto);
  }

  @Delete(':id/registrations/:regId')
  async removeRegistration(@Param('id') id: string, @Param('regId') regId: string) {
    return this.userVehicleService.removeRegistration(id, regId);
  }

  // --- INSURANCE ---

  @Post(':id/insurance')
  async createInsurance(@Param('id') id: string, @Body() dto: CreateInsuranceDto) {
    return this.userVehicleService.createInsurance(id, dto);
  }

  @Get(':id/insurance')
  async findAllInsurance(@Param('id') id: string) {
    return this.userVehicleService.findAllInsurance(id);
  }

  @Patch(':id/insurance/:insId')
  async updateInsurance(
    @Param('id') id: string,
    @Param('insId') insId: string,
    @Body() dto: UpdateInsuranceDto,
  ) {
    return this.userVehicleService.updateInsurance(id, insId, dto);
  }

  @Delete(':id/insurance/:insId')
  async removeInsurance(@Param('id') id: string, @Param('insId') insId: string) {
    return this.userVehicleService.removeInsurance(id, insId);
  }

  // --- WORK JOBS ---

  @Post(':id/work-jobs')
  async createWorkJob(@Param('id') id: string, @Body() createWorkJobDto: CreateWorkJobDto) {
    return this.userVehicleService.createWorkJob(id, createWorkJobDto);
  }

  @Get(':id/work-jobs/:workJobId')
  async findOneWorkJob(@Param('id') id: string, @Param('workJobId') workJobId: string) {
    return this.userVehicleService.findOneWorkJob(id, workJobId);
  }

  @Patch(':id/work-jobs/:workJobId')
  async updateWorkJob(
    @Param('id') id: string,
    @Param('workJobId') workJobId: string,
    @Body() updateWorkJobDto: UpdateWorkJobDto,
  ) {
    return this.userVehicleService.updateWorkJob(id, workJobId, updateWorkJobDto);
  }

  @Delete(':id/work-jobs/:workJobId')
  async removeWorkJob(@Param('id') id: string, @Param('workJobId') workJobId: string) {
    return this.userVehicleService.removeWorkJob(id, workJobId);
  }

  @Get(':id/work-jobs/:workJobId/export')
  async exportWorkJobPdf(
    @Param('id') id: string,
    @Param('workJobId') workJobId: string,
    @Res() res: Response,
  ) {
    const doc = await this.userVehicleService.exportWorkJobPdf(id, workJobId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="job-card-${workJobId}.pdf"`);
    
    doc.pipe(res);
  }

  @Post(':id/work-jobs/:workJobId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  async addWorkAttachment(
    @Param('id') id: string,
    @Param('workJobId') workJobId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }
    return this.userVehicleService.addWorkAttachment(workJobId, file);
  }

  @Delete(':id/work-jobs/:workJobId/attachments/:attachmentId')
  async removeWorkAttachment(
    @Param('id') id: string,
    @Param('workJobId') workJobId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.userVehicleService.removeWorkAttachment(workJobId, attachmentId);
  }

  // --- DOCUMENTS ---

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  async createDocument(
    @Param('id') id: string, 
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
        fileIsRequired: false,
      }),
    ) file?: Express.Multer.File
  ) {
    if (file) {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`);
      }
    }
    return this.userVehicleService.createDocument(id, createDocumentDto, file);
  }

  @Get(':id/documents/:documentId')
  async findOneDocument(@Param('id') id: string, @Param('documentId') documentId: string) {
    return this.userVehicleService.findOneDocument(id, documentId);
  }

  @Patch(':id/documents/:documentId')
  async updateDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.userVehicleService.updateDocument(id, documentId, updateDocumentDto);
  }

  @Delete(':id/documents/:documentId')
  async removeDocument(@Param('id') id: string, @Param('documentId') documentId: string) {
    return this.userVehicleService.removeDocument(id, documentId);
  }

  // --- REMINDERS ---

  @Post(':id/reminders')
  async createReminder(@Param('id') id: string, @Body() createReminderDto: CreateReminderDto) {
    return this.userVehicleService.createReminder(id, createReminderDto);
  }

  @Get(':id/reminders/:reminderId')
  async findOneReminder(@Param('id') id: string, @Param('reminderId') reminderId: string) {
    return this.userVehicleService.findOneReminder(id, reminderId);
  }

  @Patch(':id/reminders/:reminderId')
  async updateReminderMetadata(
    @Param('id') id: string,
    @Param('reminderId') reminderId: string,
    @Body() updateReminderDto: UpdateReminderDto,
  ) {
    return this.userVehicleService.updateReminderMetadata(id, reminderId, updateReminderDto);
  }

  @Delete(':id/reminders/:reminderId')
  async removeReminder(@Param('id') id: string, @Param('reminderId') reminderId: string) {
    return this.userVehicleService.removeReminder(id, reminderId);
  }

  @Patch(':id/reminders/:reminderId/status')
  async updateReminderStatus(
    @Param('id') id: string,
    @Param('reminderId') reminderId: string, 
    @Body('status') status: string
  ) {
    return this.userVehicleService.updateReminder(reminderId, status);
  }

  // --- PHOTOS ---

  @Post(':id/photos')
  @UseInterceptors(FileInterceptor('file'))
  async addPhoto(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }
    return this.userVehicleService.addVehiclePhoto(id, file);
  }

  @Post(':id/banner')
  @UseInterceptors(FileInterceptor('file'))
  async addBanner(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    ) file: Express.Multer.File,
    @Body() metadata: UpdateBannerMetadataDto,
  ) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }
    return this.userVehicleService.updateBanner(id, file, metadata);
  }

  @Patch(':id/banner/metadata')
  async updateBannerMetadata(
    @Param('id') id: string,
    @Body() metadata: UpdateBannerMetadataDto,
  ) {
    return this.userVehicleService.updateBannerMetadata(id, metadata);
  }

  @Delete(':id/banner')
  async removeBanner(@Param('id') id: string) {
    return this.userVehicleService.removeBanner(id);
  }

  @Delete(':id/photos/:photoId')
  async removePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    return this.userVehicleService.removeVehiclePhoto(id, photoId);
  }

  // --- CUSTOM SPECS ---

  @Post(':id/custom-specs')
  async createCustomSpec(
    @Param('id') id: string,
    @Body() createCustomSpecDto: CreateCustomSpecDto,
  ) {
    return this.userVehicleService.createCustomSpec(id, createCustomSpecDto);
  }

  @Patch(':id/custom-specs/:specId')
  async updateCustomSpec(
    @Param('id') id: string,
    @Param('specId') specId: string,
    @Body() updateCustomSpecDto: UpdateCustomSpecDto,
  ) {
    return this.userVehicleService.updateCustomSpec(id, specId, updateCustomSpecDto);
  }

  @Delete(':id/custom-specs/:specId')
  async removeCustomSpec(
    @Param('id') id: string,
    @Param('specId') specId: string
  ) {
    return this.userVehicleService.removeCustomSpec(id, specId);
  }
}
