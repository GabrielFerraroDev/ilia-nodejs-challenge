import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', minLength: 2 })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'john@example.com', format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Secret123!', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}
