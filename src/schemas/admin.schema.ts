import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true })
export class Admin {
    @Prop({ required: true, unique: true })
    username: string; // 아이디

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    name: string;

    @Prop({ default: 'admin' })
    role: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    lastLoginAt: Date;

    // 비밀번호 비교 메서드
    async comparePassword(candidatePassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, this.password);
    }
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

// 비밀번호 해싱 미들웨어
AdminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// 비밀번호 비교 메서드 추가
AdminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};
