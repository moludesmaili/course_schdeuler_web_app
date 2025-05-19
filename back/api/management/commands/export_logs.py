# back/api/management/commands/export_logs.py

import csv, json
from django.core.management.base import BaseCommand
from api.models import RecommendationLog

class Command(BaseCommand):
    help = "Export RecommendationLog entries to CSV"

    def handle(self, *args, **options):
        outfile = "recommendation_logs.csv"
        with open(outfile, "w", newline="") as f:
            writer = csv.writer(f)
            # Updated header:
            writer.writerow([
                "id",
                "program",
                "next_semester",
                "taken_courses",
                "result",
                "similarity_score",
                "total_credits",
                "average_difficulty_score",
                "created_at"
            ])
            for log in RecommendationLog.objects.all().order_by("created_at"):
                writer.writerow([
                    log.id,
                    log.program,
                    log.next_semester,
                    json.dumps(log.taken_courses),
                    json.dumps(log.result),
                    log.similarity_score,
                    log.total_credits,
                    log.average_difficulty_score,
                    log.created_at.isoformat(),
                ])
        self.stdout.write(self.style.SUCCESS(f"Wrote {outfile}"))
