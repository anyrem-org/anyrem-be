import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { DATE_FILTER, DATE_FILTER_ALL } from "./inboxes.constants.js";

@ValidatorConstraint({ name: "dateFilter", async: false })
export class DateFilter implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    if (DATE_FILTER.includes(text)) {
      return true;
    }

    return false;
  }

  defaultMessage(args: ValidationArguments) {
    // here you can provide default error message if validation failed
    return `Value ($value) is not in ${DATE_FILTER.join(", ")}`;
  }
}

export class InboxListQueryDto {
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ type: Boolean })
  @Transform(({ value }) =>
    value === "true" ? true : value === "false" ? false : value,
  )
  completed?: boolean;

  @IsOptional()
  @ApiPropertyOptional({
    default: DATE_FILTER_ALL,
  })
  @Validate(DateFilter)
  date?: string;
}

export class InboxInputDto {
  @MaxLength(500)
  @IsString()
  name!: string;
}

export class UpdateInboxInputDto {
  @MaxLength(500)
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  name?: string;
}
