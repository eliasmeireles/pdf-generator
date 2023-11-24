import PDFGeneratorService from "../service/PDFGeneratorService";
import {Request, Response} from 'express';

export const  PDFGenerate = async (req: Request, res: Response) =>
    PDFGeneratorService.PDFGenerator(req, res)
