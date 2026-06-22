import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private readonly transporter;
  private readonly from: string;
  constructor(config: ConfigService) {
    this.from = config.getOrThrow("SMTP_FROM");
    this.transporter = nodemailer.createTransport({
      host: config.getOrThrow("SMTP_HOST"),
      port: Number(config.get("SMTP_PORT", 587)),
      secure: false,
      auth: config.get("SMTP_USER")
        ? { user: config.get("SMTP_USER"), pass: config.get("SMTP_PASS") }
        : undefined,
    });
  }
  send(to: string, subject: string, text: string, html?: string) {
    return this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      text,
      html,
    });
  }
}
