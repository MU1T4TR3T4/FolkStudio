import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json(
                { status: "error", message: "Todos os campos são obrigatórios." },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { status: "error", message: "Este email já está em uso." },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        const token = signToken({ userId: newUser.id, email: newUser.email, name: newUser.name });

        const response = NextResponse.json({
            status: "success",
            message: "Conta criada com sucesso!",
            data: { user: { id: newUser.id, name: newUser.name, email: newUser.email } },
        });

        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 30, // 30 dias
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Register Error:", error);
        return NextResponse.json(
            { status: "error", message: "Erro ao criar conta." },
            { status: 500 }
        );
    }
}
