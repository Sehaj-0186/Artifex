import * as React from 'react';
import { TextareaAutosize as BaseTextareaAutosize } from '@mui/base/TextareaAutosize';
import { styled } from '@mui/system';
import { ArrowRight } from 'lucide-react';

const ExpandableInput = ({ value, onChange, onSubmit, placeholder }) => {
  const Textarea = styled(BaseTextareaAutosize)(
    () => `
    width: 100%;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    padding: 12px 16px;
    padding-right: 48px;
    border-radius: 9999px;
    color: white;
    background: rgba(39, 39, 42, 0.5);
    border: 1px solid rgb(63, 63, 70);
    resize: none;
    transition: all 0.2s ease-in-out;

    &:hover {
      border-color: rgb(99, 102, 241);
    }

    &:focus {
      border-color: rgb(99, 102, 241);
      outline: none;
    }

    &:focus-visible {
      outline: none;
    }
  `);

  return (
    <div className="relative w-full">
      <Textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxRows={7}
        minRows={1}
      />
      <button
        onClick={onSubmit}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-br 
          from-indigo-600 to-pink-300 from-[0%] to-[100%] rounded-full 
          hover:scale-105 transition-all duration-400 ease-in-out"
      >
        <ArrowRight className="w-5 h-5 text-white" />
      </button>
    </div>
  );
};

export default ExpandableInput;
