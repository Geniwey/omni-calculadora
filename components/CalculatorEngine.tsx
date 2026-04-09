"use client";

import { useState } from "react";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import jsonLogic from "json-logic-js";

export default function CalculatorEngine({ calculator }: { calculator: any }) {
  const [result, setResult] = useState<number | null>(null);

  const onSubmit = ({ formData }: any) => {
    try {
      const res = jsonLogic.apply(calculator.logic, formData);
      setResult(Number(res.toFixed(2)));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100 mt-10">
      <h2 className="text-2xl font-bold mb-2">{calculator.title}</h2>
      <p className="text-gray-500 mb-6">{calculator.description}</p>
      
      <Form schema={calculator.schema} validator={validator} onSubmit={onSubmit} className="space-y-4">
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
          Calcular Ahora
        </button>
      </Form>

      {result !== null && (
        <div className="mt-8 p-6 bg-blue-50 rounded-xl text-center border border-blue-100">
          <p className="text-blue-800 font-semibold">{calculator.resultLabel}</p>
          <p className="text-5xl font-black text-blue-600 mt-2">{result}</p>
          <a href={calculator.fallbackAffiliateLink} className="inline-block mt-4 text-sm font-bold text-white bg-green-500 px-4 py-2 rounded-full">
            Ver ofertas recomendadas
          </a>
        </div>
      )}
    </div>
  );
}
