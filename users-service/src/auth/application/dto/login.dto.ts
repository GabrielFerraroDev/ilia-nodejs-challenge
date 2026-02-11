import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com', format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Secret123!' })
  @IsString()
  @MinLength(1)
  password!: string;
}
