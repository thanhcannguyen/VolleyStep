
interface DuplicateKeyError extends Error {
    code: number;
}

export const isDuplicateKeyError = (
    error: unknown,
): error is DuplicateKeyError => {
    return (
        error instanceof Error &&
        "code" in error &&
        error.code === 11000
    );
};