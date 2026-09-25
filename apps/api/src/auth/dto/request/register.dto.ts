import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Inserisci un indirizzo email valido' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La password deve contenere almeno 8 caratteri' })
  @MaxLength(128, { message: 'La password non può superare 128 caratteri' })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
