import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { status: "error", message: "Email e senha são obrigatórios." },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { status: "error", message: "Credenciais inválidas." },
                { status: 401 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { status: "error", message: "Credenciais inválidas." },
                { status: 401 }
            );
        }

        const token = signToken({ userId: user.id, email: user.email, name: user.name });

        const response = NextResponse.json({
            status: "success",
            message: "Login realizado com sucesso!",
            data: { user: { id: user.id, name: user.name, email: user.email } },
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
        console.error("Login Error:", error);
        return NextResponse.json(
            { status: "error", message: "Erro ao realizar login." },
            { status: 500 }
        );
    }
}
