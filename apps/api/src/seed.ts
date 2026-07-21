
import {
    connectDatabase,
    disconnectDatabase,
} from "./config/database";
import { env } from "./config/env";
import { BrandModel } from "./models/brand.model";
import { CategoryModel } from "./models/category.model";
import { ProductModel } from "./models/product.model";
import { UserModel } from "./models/user.model";
import { hashPassword } from "./utils/password";

const ADMIN_EMAIL = "admin@volleystep.local";
const ADMIN_PASSWORD = "Admin@123456";
const CUSTOMER_EMAIL = "customer@volleystep.local";
const CUSTOMER_PASSWORD = "Customer@123456";

const assertSeedIsAllowed = (): void => {
    if (
        env.NODE_ENV === "production" &&
        process.env.ALLOW_PROD_SEED !== "true"
    ) {
        throw new Error(
            "Refusing to run seed against production. Set ALLOW_PROD_SEED=true to override.",
        );
    }
};

const seedUsers = async (): Promise<void> => {
    const adminPasswordHash = await hashPassword(
        ADMIN_PASSWORD,
    );
    const customerPasswordHash = await hashPassword(
        CUSTOMER_PASSWORD,
    );

    await UserModel.findOneAndUpdate(
        { email: ADMIN_EMAIL },
        {
            $setOnInsert: {
                fullName: "VolleyStep Admin",
                email: ADMIN_EMAIL,
                passwordHash: adminPasswordHash,
                role: "ADMIN",
                status: "ACTIVE",
            },
        },
        { upsert: true },
    );

    await UserModel.findOneAndUpdate(
        { email: CUSTOMER_EMAIL },
        {
            $setOnInsert: {
                fullName: "VolleyStep Customer",
                email: CUSTOMER_EMAIL,
                passwordHash: customerPasswordHash,
                role: "CUSTOMER",
                status: "ACTIVE",
            },
        },
        { upsert: true },
    );

    console.log(
        `Seeded users: ${ADMIN_EMAIL} / ${CUSTOMER_EMAIL}`,
    );
};

const seedCatalog = async (): Promise<void> => {
    await ProductModel.deleteMany({});
    await BrandModel.deleteMany({});
    await CategoryModel.deleteMany({});

    const brands = await BrandModel.insertMany([
        {
            name: "Mizuno",
            slug: "mizuno",
            description:
                "Thuong hieu giay bong chuyen Nhat Ban",
        },
        {
            name: "Asics",
            slug: "asics",
            description:
                "Giay the thao chuyen nghiep Nhat Ban",
        },
        {
            name: "Nike",
            slug: "nike",
            description: "Thuong hieu the thao toan cau",
        },
    ]);

    const categories = await CategoryModel.insertMany([
        {
            name: "Giay thi dau",
            slug: "giay-thi-dau",
            description:
                "Giay danh cho thi dau chuyen nghiep",
        },
        {
            name: "Giay tap luyen",
            slug: "giay-tap-luyen",
            description:
                "Giay danh cho tap luyen hang ngay",
        },
    ]);

    const [mizuno, asics, nike] = brands;
    const [matchCategory, trainingCategory] = categories;

    await ProductModel.insertMany([
        {
            name: "Mizuno Wave Lightning Z7",
            slug: "mizuno-wave-lightning-z7",
            description:
                "Giay bong chuyen thi dau cao cap, de em, bam san tot.",
            brandId: mizuno!._id,
            categoryId: matchCategory!._id,
            variants: [
                {
                    sku: "MWZ7-BLK-40",
                    color: "Den",
                    size: "40",
                    price: 2890000,
                    stock: 15,
                    images: [
                        "https://placehold.co/600x600?text=Mizuno+Z7",
                    ],
                },
                {
                    sku: "MWZ7-BLK-41",
                    color: "Den",
                    size: "41",
                    price: 2890000,
                    stock: 12,
                    images: [
                        "https://placehold.co/600x600?text=Mizuno+Z7",
                    ],
                },
            ],
        },
        {
            name: "Asics Sky Elite FF 2",
            slug: "asics-sky-elite-ff-2",
            description:
                "Giay thi dau chuyen nghiep, cong nghe dem FlyteFoam.",
            brandId: asics!._id,
            categoryId: matchCategory!._id,
            variants: [
                {
                    sku: "ASK-FF2-WHT-39",
                    color: "Trang",
                    size: "39",
                    price: 3190000,
                    stock: 10,
                    images: [
                        "https://placehold.co/600x600?text=Asics+FF2",
                    ],
                },
            ],
        },
        {
            name: "Nike Zoom Hyperace 3",
            slug: "nike-zoom-hyperace-3",
            description:
                "Giay bong chuyen phong cach, de Zoom Air em ai.",
            brandId: nike!._id,
            categoryId: trainingCategory!._id,
            variants: [
                {
                    sku: "NZH3-RED-40",
                    color: "Do",
                    size: "40",
                    price: 2590000,
                    stock: 20,
                    images: [
                        "https://placehold.co/600x600?text=Nike+Hyperace",
                    ],
                },
                {
                    sku: "NZH3-RED-42",
                    color: "Do",
                    size: "42",
                    price: 2590000,
                    stock: 8,
                    images: [
                        "https://placehold.co/600x600?text=Nike+Hyperace",
                    ],
                },
            ],
        },
    ]);

    console.log(
        "Seeded brands, categories and products",
    );
};

const runSeed = async (): Promise<void> => {
    assertSeedIsAllowed();
    await connectDatabase();

    try {
        await seedUsers();
        await seedCatalog();
        console.log("Seed completed successfully");
    } finally {
        await disconnectDatabase();
    }
};

runSeed().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
});