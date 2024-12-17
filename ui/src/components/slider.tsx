import { useState } from "react";

export default function Slider({
  endpoint,
}: {
  endpoint: string | null;
}) {
  const [color, setColor] = useState<{
    color_r: number;
    color_g: number;
    color_b: number;
  }>({
    color_r: 255,
    color_g: 0,
    color_b: 0,
  });

  const handleSliderChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    channel: "color_r" | "color_g" | "color_b"
  ) => {
    const newValue = parseInt(event.target.value);
    const newColor = { ...color, [channel]: newValue };
    setColor(newColor);
    await updateTestJson(newColor);
  };

  const updateTestJson = async (colorValue: {
    color_r: number;
    color_g: number;
    color_b: number;
  }) => {
    try {
      const response = await fetch("/api/update_inputs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint,
          nodeId: 2,
          values: colorValue,
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text(); 
        console.error(`Error del servidor: ${errorText}`);
        throw new Error(`offer HTTP error: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Actualización exitosa:", data);
    } catch (error) {
      console.error("Error de red o del servidor:", error);
    }
  };

  return (
    <div className="absolute left-0 bottom-0 w-full h-fit flex flex-col text-white gap-2">
      <h3>Ajustar Color</h3>

      <div>
        <label>Rojo: {color.color_r}</label>
        <input
          type="range"
          min="0"
          max="255"
          step="1"
          value={color.color_r}
          onChange={(e) => handleSliderChange(e, "color_r")}
          style={{ width: "100%" }}
        />
      </div>

      <div>
        <label>Verde: {color.color_g}</label>
        <input
          type="range"
          min="0"
          max="255"
          step="1"
          value={color.color_g}
          onChange={(e) => handleSliderChange(e, "color_g")}
          style={{ width: "100%" }}
        />
      </div>

      <div>
        <label>Azul: {color.color_b}</label>
        <input
          type="range"
          min="0"
          max="255"
          step="1"
          value={color.color_b}
          onChange={(e) => handleSliderChange(e, "color_b")}
          style={{ width: "100%" }}
        />
      </div>

      <p>
        Color actual: RGB({color.color_r}, {color.color_g}, {color.color_b})
      </p>
    </div>
  );
}
