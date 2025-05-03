"use client";
import { BACKEND_URL, CLOUDFRONT_URL } from "@/utils";
import axios from "axios";
import { useState } from "react";

export function UploadImage({
    onImageAdded,
    image,
}: {
    onImageAdded: (image: string) => void;
    image?: string;
}) {
    const [uploading, setUploading] = useState(false);

    async function onFileSelect(e: any) {
        setUploading(true);
        try {
            const file = e.target.files[0];
            const response = await axios.get(`${BACKEND_URL}/v1/user/presignedUrl`, {
                headers: {
                    Authorization: localStorage.getItem("token"),
                },
            });

            const presignedUrl = response.data.preSignedUrl;
            const formData = new FormData();
            formData.set("bucket", response.data.fields["bucket"]);
            formData.set("X-Amz-Algorithm", response.data.fields["X-Amz-Algorithm"]);
            formData.set("X-Amz-Credential", response.data.fields["X-Amz-Credential"]);
            formData.set("X-Amz-Date", response.data.fields["X-Amz-Date"]);
            formData.set("key", response.data.fields["key"]);
            formData.set("Policy", response.data.fields["Policy"]);
            formData.set("X-Amz-Signature", response.data.fields["X-Amz-Signature"]);
            formData.set("Content-Type", file.type);
            formData.append("file", file);
            await axios.post(presignedUrl, formData);

            onImageAdded(`${CLOUDFRONT_URL}/${response.data.fields["key"]}`);
        } catch (e) {
            console.log(e);
        }
        setUploading(false);
    }

    if (image) {
        return (
            <img
                className="p-2 w-40 h-40 object-cover rounded-lg border border-gray-300 shadow-md mx-auto"
                src={image}
                alt="Uploaded"
            />
        );
    }

    return (
        <div className="w-40 h-40 rounded-lg border-2 border-dashed border-gray-300 text-2xl cursor-pointer relative flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition duration-200 ease-in-out mx-auto">
            {uploading ? (
                <div className="text-sm text-gray-600">Loading...</div>
            ) : (
                <>
                    <span className="text-gray-500 text-4xl">+</span>
                    <input
                        className="absolute w-full h-full opacity-0 cursor-pointer"
                        type="file"
                        onChange={onFileSelect}
                    />
                </>
            )}
        </div>
    );
}