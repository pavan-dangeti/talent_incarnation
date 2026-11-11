CREATE TABLE "assessment_answer" (
	"assessment_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"question_id" text NOT NULL,
	"choice" smallint NOT NULL,
	"is_correct" boolean NOT NULL,
	"answered_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_answer_assessment_id_position_pk" PRIMARY KEY("assessment_id","position"),
	CONSTRAINT "assessment_answer_question_once" UNIQUE("assessment_id","question_id"),
	CONSTRAINT "assessment_answer_choice_check" CHECK ("assessment_answer"."choice" between 0 and 3)
);
--> statement-breakpoint
CREATE TABLE "assessment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"theta" real,
	"se" real,
	"score" integer,
	"level" text,
	CONSTRAINT "assessment_domain_check" CHECK ("assessment"."domain" in ('software', 'data-ai', 'ui-ux')),
	CONSTRAINT "assessment_status_check" CHECK ("assessment"."status" in ('in_progress', 'completed'))
);
--> statement-breakpoint
ALTER TABLE "assessment_answer" ADD CONSTRAINT "assessment_answer_assessment_id_assessment_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_one_in_progress" ON "assessment" USING btree ("user_id","domain") WHERE "assessment"."status" = 'in_progress';