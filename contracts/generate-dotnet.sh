#!/bin/bash
set -e

INPUT_SPEC="contracts/openapi/openapi.yaml"
OUTPUT_DIR="contracts/generated/dotnet"
OUTPUT_FILE="$OUTPUT_DIR/Models.cs"

# Clean and recreate directory
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

echo "Generating C# Models with NSwag..."

# Use DOTNET_ROLL_FORWARD=Major to allow NSwag's .NET 8 binary to run on your .NET 10 runtime
DOTNET_ROLL_FORWARD=Major pnpm dlx nswag openapi2csclient \
  /input:"$INPUT_SPEC" \
  /output:"$OUTPUT_FILE" \
  /namespace:"KanbanApi.Contracts.Models" \
  /generateClientClasses:false \
  /generateClientInterfaces:false \
  /generateExceptionClasses:false \
  /generateDataAnnotations:false \
  /classStyle:Record

echo "✓ C# models generated in $OUTPUT_FILE"
