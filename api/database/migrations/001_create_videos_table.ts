import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "videos";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary();
      table.string("original_filename").notNullable();
      table
        .enum("status", ["pending", "processing", "completed", "failed"])
        .notNullable()
        .defaultTo("pending");
      table.integer("progress").notNullable().defaultTo(0);
      table.float("duration_seconds").nullable();
      table.integer("width").nullable();
      table.integer("height").nullable();
      table.integer("frame_count").nullable();
      table.integer("unique_people").nullable();
      table.integer("max_people_in_frame").nullable();
      table.float("average_people_per_frame").nullable();
      table.float("processing_time_seconds").nullable();
      table.string("original_path").notNullable();
      table.string("processed_path").nullable();
      table.string("report_path").nullable();
      table.text("error_message").nullable();
      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
