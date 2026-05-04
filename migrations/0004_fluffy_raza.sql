CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('ISSUED', 'VOIDED', 'REFUNDED', 'FAILED');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_session_id" text,
	"stripe_payment_intent_id" text,
	"status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"total_price_cents" integer NOT NULL,
	"origin_iata" varchar(3) NOT NULL,
	"destination_iata" varchar(3) NOT NULL,
	"departure_at" timestamp with time zone NOT NULL,
	"arrival_at" timestamp with time zone NOT NULL,
	"segments_summary" jsonb NOT NULL,
	"passenger_first_name" varchar(100) NOT NULL,
	"passenger_last_name" varchar(100) NOT NULL,
	"passenger_email" text NOT NULL,
	"passenger_date_of_birth" date,
	"flight_offer_snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	CONSTRAINT "bookings_stripe_session_id_unique" UNIQUE("stripe_session_id"),
	CONSTRAINT "bookings_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"status" "ticket_status" NOT NULL,
	"ticket_numbers" jsonb,
	"provider" varchar(50) NOT NULL,
	"issued_by_user_id" integer,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "name" TO "first_name";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_issued_by_user_id_users_id_fk" FOREIGN KEY ("issued_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "index_bookings_user_id" ON "bookings" USING btree ("user_id");