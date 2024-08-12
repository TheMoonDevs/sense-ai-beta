interface MLGenerateImageProps {
  prompt: string;
  negative_prompt?: string;
  model?: string;
  width?: string;
  height?: string;
  guidance_scale?: string;
  enableNSFW?: boolean;
  samples?: string;
  init_image?: string;
  prompt_strength?: string;
  scheduler?: string;
}

export const ModelLabsSdk = {
  generateImage: async ({
    prompt,
    negative_prompt,
    model,
    width,
    height,
    guidance_scale,
    enableNSFW,
    samples = "1",
    init_image,
    prompt_strength,
    scheduler,
  }: MLGenerateImageProps) => {
    const schedulers = [
      "DPMSolverMultistepScheduler",
      "UniPCMultistepScheduler",
    ];
    let selectedScheduler =
      scheduler || schedulers[Math.floor(Math.random() * schedulers.length)];

    let gen: any = {
      key: process.env.ML_API_Key,
      prompt: prompt,
      negative_prompt: model
        ? "lowres, text, error, cropped, (worst quality:1.2), (low quality:1.2), text copyright signature, ugly, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, long neck, username, watermark, signature, cartoon, 3d, ((disfigured)), ((bad art)), ((deformed)), ((poorly drawn)), ((extra limbs)), ((close up)), ((b&w)), weird colors, blurry"
        : negative_prompt || "",
      width: width || "1024",
      height: height || "1024",
      samples: samples || "1",
      safety_checker: enableNSFW ? "no" : "yes",
      guidance_scale: guidance_scale ? parseInt(guidance_scale) : 8,
      clip_skip: 1,
      self_attention: "yes",
      safety_checker_type: "sensitive_content_text",
      lora_strength: 1,
      instant_response: "yes",
      scheduler: selectedScheduler,
    };

    gen.model_id = model || "realistic-vision-v13";
    if (init_image) gen.init_image = init_image;
    if (init_image) gen.negative_prompt = null;
    if (init_image && prompt_strength) gen.prompt_strength = prompt_strength;

    let endpoint =
      init_image && init_image != ""
        ? "https://modelslab.com/api/v6/images/img2img"
        : "https://modelslab.com/api/v6/images/text2img";

    console.log(endpoint);
    console.log(gen);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gen),
    });
    if (!response.ok) {
      console.log(response.statusText);
      throw response.statusText;
    }
    return await response.json();
  },
};
