import React, { useState } from 'react';
import { Button } from '@payloadcms/ui/elements/Button';

export const BulkUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleUploadFiles = (files: File[]) => {
    const uploaded = [...uploadedFiles];
    files.some((file) => {
      if (uploaded.findIndex((f) => f.name === file.name) === -1) {
        uploaded.push(file);
      }
    });
    setUploadedFiles(uploaded);
  };

  const handleFileEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosenFiles = Array.prototype.slice.call(e.target.files);
    handleUploadFiles(chosenFiles);
  };

  const upload = async () => {
    const results = await Promise.all(
      uploadedFiles.map((file) => {
        let formData = new FormData();

        formData.append('file', file);
        formData.append('alt', file.name); // edit this
        const options = {
          method: 'POST',
          body: formData,
        };

        return fetch('/api/media', options); // edit this
      }),
    );
  };

  return (
    <>
      <input
        onChange={handleFileEvent}
        style={{ display: 'none' }}
        id="fileUpload"
        type="file"
        multiple
        accept="image/png, image/jpeg, image/jpg, image/webp"
      />
      <label htmlFor="fileUpload">
        <a className="btn btn-primary">Select files...</a>
      </label>
      <div className="uploaded-files-list">
        {uploadedFiles.map((file) => (
          <div key={file.name}>{file.name}</div>
        ))}
      </div>
      <Button disabled={!uploadedFiles.length} onClick={upload}>
        Upload
      </Button>
    </>
  );
};
