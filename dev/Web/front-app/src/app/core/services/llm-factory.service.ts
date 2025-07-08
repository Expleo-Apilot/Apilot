import { Injectable } from '@angular/core';
import { LlmService } from './llm.service';
import { OllamaService } from './ollama.service';
import { GeminiService } from './gemini.service';
import { MistralService } from './mistral.service';

export enum LlmType {
  OLLAMA = 'ollama',
  GEMINI = 'gemini',
  MISTRAL = 'mistral'
}

@Injectable({
  providedIn: 'root'
})
export class LlmFactoryService {
  private currentLlmType: LlmType = LlmType.OLLAMA;

  constructor(
    private ollamaService: OllamaService,
    private geminiService: GeminiService,
    private mistralService: MistralService
  ) { }

  /**
   * Get the current LLM service based on selected type
   * @returns The current LLM service
   */
  getCurrentLlm(): LlmService {
    return this.getLlm(this.currentLlmType);
  }

  /**
   * Get a specific LLM service by type
   * @param type The type of LLM to get
   * @returns The requested LLM service
   */
  getLlm(type: LlmType): LlmService {
    switch (type) {
      case LlmType.GEMINI:
        return this.geminiService;
      case LlmType.MISTRAL:
        return this.mistralService;
      case LlmType.OLLAMA:
      default:
        return this.ollamaService;
    }
  }

  /**
   * Set the current LLM type
   * @param type The LLM type to set as current
   */
  setCurrentLlmType(type: LlmType): void {
    this.currentLlmType = type;
  }

  /**
   * Get the current LLM type
   * @returns The current LLM type
   */
  getCurrentLlmType(): LlmType {
    return this.currentLlmType;
  }

  /**
   * Get all available LLM types
   * @returns Array of all LLM types
   */
  getAllLlmTypes(): LlmType[] {
    return Object.values(LlmType);
  }
}
