
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0004_user_session_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_deleted',
            field=models.BooleanField(
                default=False,
                help_text='Indicates if account has been deleted',
                db_index=True
            ),
        ),
        
        migrations.AddField(
            model_name='user',
            name='deleted_at',
            field=models.DateTimeField(
                null=True,
                blank=True,
                help_text='Timestamp of account deletion'
            ),
        ),
        migrations.AlterField(
            model_name='auditlog',
            name='action',
            field=models.CharField(
                max_length=50,
                choices=[
                    ('password_reset', 'Password Reset'),
                    ('login', 'Login'),
                    ('logout', 'Logout'),
                    ('oauth_login', 'OAuth Login'),
                    ('account_deleted', 'Account Deleted'),
                ],
                null=True,
                blank=True
            ),
        ),
        migrations.CreateModel(
            name='AccountDeletionFeedback',
            fields=[
                ('id', models.BigAutoField(
                    auto_created=True, 
                    primary_key=True, 
                    serialize=False, 
                    verbose_name='ID'
                )),
                ('user_id', models.IntegerField(
                    help_text='Original user ID (preserved for analytics)'
                )),
                ('user_email', models.EmailField(
                    max_length=254,
                    help_text='Email at time of deletion (for audit trail)'
                )),
                ('user_name', models.CharField(
                    max_length=50,
                    help_text='Name at time of deletion'
                )),
                ('reason', models.CharField(
                    max_length=50,
                    choices=[
                        ('better_alternative', 'Found a better alternative'),
                        ('not_using', 'Not using the service anymore'),
                        ('privacy_concerns', 'Privacy concerns'),
                        ('too_many_notifications', 'Too many notifications'),
                        ('difficult_to_use', 'Difficult to use'),
                        ('other', 'Other'),
                    ],
                    help_text='Primary reason for account deletion'
                )),
                ('comments', models.TextField(
                    max_length=500,
                    blank=True,
                    null=True,
                    help_text='Additional comments from user'
                )),
                ('deleted_at', models.DateTimeField(
                    auto_now_add=True,
                    help_text='Timestamp of account deletion'
                )),
            ],
            options={
                'db_table': 'account_deletion_feedback',
                'ordering': ['-deleted_at'],
                'verbose_name': 'Account Deletion Feedback',
                'verbose_name_plural': 'Account Deletion Feedbacks',
            },
        ),

        migrations.AddIndex(
            model_name='accountdeletionfeedback',
            index=models.Index(
                fields=['deleted_at'],
                name='acct_del_fb_deleted_at_idx'
            ),
        ),
        migrations.AddIndex(
            model_name='accountdeletionfeedback',
            index=models.Index(
                fields=['reason'],
                name='acct_del_fb_reason_idx'
            ),
        ),
        
        # Add composite index for user deletion queries
        migrations.AddIndex(
            model_name='user',
            index=models.Index(
                fields=['is_deleted', 'deleted_at'],
                name='user_deletion_idx'
            ),
        ),
    ]
